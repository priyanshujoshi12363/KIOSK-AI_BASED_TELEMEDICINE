import { useEffect, useRef, useState } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { agentScript, speechLocale } from "../i18n.js";
import { speak } from "../lib/speech.js";
import { detectLanguage } from "../lib/lang.js";
import { preloadWhisper, transcribe } from "../lib/whisper.js";
import { recordUntilSilence } from "../lib/audio.js";
import { streamAgent, detectRedFlags, warmupOllama } from "../lib/ollama.js";

const MAX_TURNS = 3;

export default function Agent() {
  const { t, setLang, setSymptoms, go, villager } = useKiosk();
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState("loading");
  const [draft, setDraft] = useState("");
  const startedRef = useRef(false);
  const typedResolveRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, phase]);

  function pushMsg(role, text) {
    setMessages((m) => [...m, { role, text }]);
  }

  function updateLastAgent(text) {
    setMessages((m) => {
      const copy = [...m];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "agent") {
          copy[i] = { role: "agent", text };
          break;
        }
      }
      return copy;
    });
  }

  function listenTurn(langHint) {
    setPhase("listening");
    return new Promise((resolve) => {
      let settled = false;
      const finish = (text) => {
        if (settled) return;
        settled = true;
        typedResolveRef.current = null;
        resolve((text || "").trim());
      };
      typedResolveRef.current = finish;
      (async () => {
        try {
          const { audio } = await recordUntilSilence();
          if (settled) return;
          if (!audio) return finish("");
          setPhase("thinking");
          const text = await transcribe(audio, langHint);
          finish(text);
        } catch {
          finish("");
        }
      })();
    });
  }

  function submitTyped() {
    const v = draft.trim();
    if (v && typedResolveRef.current) {
      setDraft("");
      typedResolveRef.current(v);
    }
  }

  async function speakReply(text, locale) {
    setPhase("speaking");
    await speak(text, locale);
  }

  async function streamReply(llm) {
    setPhase("thinking");
    pushMsg("agent", "");
    let acc = "";
    for await (const chunk of streamAgent(llm)) {
      acc += chunk;
      updateLastAgent(acc);
    }
    return acc.trim();
  }

  async function run() {
    preloadWhisper();
    warmupOllama();

    const llm = [];
    const answers = [];
    let lang = "hi";

    const greeting = agentScript.hi[0];
    pushMsg("agent", greeting);
    await speakReply(greeting, speechLocale.hi);
    llm.push({ role: "assistant", content: greeting });

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      let userText = await listenTurn(turn === 0 ? null : lang);
      if (!userText) userText = await listenTurn(turn === 0 ? null : lang);
      if (!userText) continue;

      lang = detectLanguage(userText);
      setLang(lang);
      pushMsg("user", userText);
      llm.push({ role: "user", content: userText });
      answers.push(userText);

      if (detectRedFlags(userText).length) {
        setSymptoms(answers.join(". "));
        setPhase("emergency");
        const em =
          lang === "hi"
            ? "यह गंभीर हो सकता है। मैं तुरंत डॉक्टर से जोड़ रहा हूँ।"
            : "This may be serious. Connecting you to a doctor immediately.";
        pushMsg("agent", em);
        await speak(em, speechLocale[lang]);
        setTimeout(() => go("CONSULT"), 1400);
        return;
      }

      if (turn < MAX_TURNS - 1) {
        const reply = await streamReply(llm);
        llm.push({ role: "assistant", content: reply });
        await speakReply(reply, speechLocale[detectLanguage(reply)]);
      }
    }

    setSymptoms(answers.join(". "));
    const closing =
      lang === "hi"
        ? "धन्यवाद। मैं अब आपको डॉक्टर से जोड़ रहा हूँ।"
        : "Thank you. Connecting you to a doctor now.";
    pushMsg("agent", closing);
    await speakReply(closing, speechLocale[lang]);
    setPhase("done");
    setTimeout(() => go("CONSULT"), 1400);
  }

  const statusLabel =
    phase === "loading"
      ? "…"
      : phase === "speaking"
        ? t.speakingLabel
        : phase === "listening"
          ? t.listeningLabel
          : phase === "thinking"
            ? "…"
            : phase === "emergency"
              ? "!"
              : "";

  return (
    <div className="flex h-[72vh] flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/10 text-2xl">
          🩺
        </div>
        <div>
          <div className="font-bold text-zinc-900">AI Health Assistant</div>
          <div className="text-xs text-zinc-500">{villager?.name}</div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-zinc-200 bg-white/70 p-5"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-lg ${
                m.role === "user" ? "bg-saffron text-zinc-950" : "bg-zinc-100 text-zinc-800"
              }`}
            >
              {m.text || "…"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-3 flex items-center justify-center gap-3">
          {phase === "listening" && (
            <span className="flex items-center gap-2 text-red-500">
              <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
              <span className="font-semibold">{statusLabel}</span>
            </span>
          )}
          {(phase === "speaking" || phase === "thinking" || phase === "loading") && (
            <span className="flex items-center gap-2 text-navy">
              <span className="h-3 w-3 animate-pulse rounded-full bg-navy" />
              <span className="font-semibold">{statusLabel}</span>
            </span>
          )}
          {phase === "emergency" && (
            <span className="font-semibold text-red-600">⚠ Emergency</span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTyped()}
            placeholder={t.typeAnswer}
            disabled={phase !== "listening"}
            className="flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-lg text-zinc-900 outline-none focus:border-saffron disabled:bg-zinc-50"
          />
          <button
            onClick={submitTyped}
            disabled={phase !== "listening" || !draft.trim()}
            className="rounded-xl bg-saffron px-6 py-3 text-lg font-bold text-zinc-950 disabled:opacity-40"
          >
            {t.send}
          </button>
        </div>
      </div>
    </div>
  );
}
