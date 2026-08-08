import { useEffect, useRef, useState } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { agentScript, speechLocale } from "../i18n.js";
import { speak } from "../lib/speech.js";
import { detectLanguage } from "../lib/lang.js";
import { preloadWhisper, transcribe } from "../lib/whisper.js";
import { recordUntilSilence } from "../lib/audio.js";
import { streamAgent, detectRedFlags, warmupOllama } from "../lib/ollama.js";
import { STT_ENABLED, LLM_ENABLED } from "../lib/aiConfig.js";

const MAX_TURNS = 3;

export default function Agent() {
  const { t, setLang, setSymptoms, setRedFlags, go, villager } = useKiosk();
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

      if (!STT_ENABLED) return;

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

  function scriptedReply(turn, lang) {
    const script = agentScript[lang] || agentScript.hi;
    const reply = script[Math.min(turn + 1, script.length - 2)];
    pushMsg("agent", reply);
    return reply;
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

      const flags = detectRedFlags(userText);
      if (flags.length) {
        setRedFlags(flags);
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
        const reply = LLM_ENABLED
          ? await streamReply(llm)
          : scriptedReply(turn, lang);
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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-[#2a2f7a] text-2xl shadow-md">
          🩺
        </div>
        <div>
          <div className="font-bold text-zinc-900">AI Health Assistant</div>
          <div className="text-xs font-medium text-zinc-500">{villager?.name}</div>
        </div>
        <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full">
          <div className="flex h-full">
            <div className="flex-1 bg-saffron" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-indiagreen" />
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="glass flex-1 space-y-3 overflow-y-auto rounded-3xl p-5 shadow-sm"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-lg shadow-sm ${
                m.role === "user"
                  ? "bg-gradient-to-br from-saffron to-[#ff8a1f] text-zinc-950"
                  : "border border-zinc-200 bg-white text-zinc-800"
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
            className="flex-1 rounded-2xl border-2 border-zinc-200 bg-white/80 px-5 py-3.5 text-lg text-zinc-900 shadow-sm outline-none transition focus:border-saffron focus:ring-2 focus:ring-saffron/25 disabled:bg-zinc-50"
          />
          <button
            onClick={submitTyped}
            disabled={phase !== "listening" || !draft.trim()}
            className="rounded-2xl bg-gradient-to-br from-saffron to-[#ff8a1f] px-7 py-3.5 text-lg font-bold text-zinc-950 shadow-sm transition hover:brightness-105 disabled:opacity-40"
          >
            {t.send}
          </button>
        </div>
      </div>
    </div>
  );
}
