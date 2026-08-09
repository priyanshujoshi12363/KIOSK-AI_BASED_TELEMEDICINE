import { useEffect, useRef, useState } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { agentScript, speechLocale } from "../i18n.js";
import { detectLanguage } from "../lib/lang.js";
import { preloadWhisper } from "../lib/whisper.js";
import { recordUntilSilence } from "../lib/audio.js";
import { detectRedFlags, warmupOllama } from "../lib/ollama.js";
import { STT_ENABLED } from "../lib/aiConfig.js";
import { askAgent, speakText, transcribeAudio, isOnline } from "../lib/ai.js";

const MAX_TURNS = 3;

const SYSTEM_PROMPT =
  "You are a health intake assistant at a rural tele-medicine kiosk in India. " +
  "Reply in the SAME language the patient uses (Hindi, Gujarati or English). " +
  "Ask only ONE short simple question at a time. " +
  "Gather: main problem, how long it has lasted, severity, and other symptoms. " +
  "Never diagnose or prescribe. You only collect information for the doctor. " +
  "Keep every reply under 25 words.";

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
      const finish = (value) => {
        if (settled) return;
        settled = true;
        typedResolveRef.current = null;
        resolve(
          typeof value === "string"
            ? { text: value.trim(), audio: null }
            : { text: (value.text || "").trim(), audio: value.audio || null }
        );
      };
      typedResolveRef.current = finish;

      (async () => {
        try {
          const { audio } = await recordUntilSilence();
          if (settled) return;
          if (!audio) return finish("");
          setPhase("thinking");
          const cloud = await isOnline();
          if (!cloud && !STT_ENABLED) return finish({ text: "", audio });
          const { text } = await transcribeAudio(audio, langHint);
          finish({ text, audio });
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

  async function speakReply(text, lang) {
    setPhase("speaking");
    await speakText(text, lang, speechLocale[lang]);
  }

  function scriptedReply(turn, lang) {
    const script = agentScript[lang] || agentScript.hi;
    return script[Math.min(turn + 1, script.length - 2)];
  }

  async function run() {
    preloadWhisper();
    warmupOllama();

    const llm = [];
    const answers = [];
    let lang = "hi";

    const greeting = agentScript.hi[0];
    pushMsg("agent", greeting);
    await speakReply(greeting, "hi");
    llm.push({ role: "assistant", content: greeting });

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      let heard = await listenTurn(turn === 0 ? null : lang);
      if (!heard.text && !heard.audio) heard = await listenTurn(turn === 0 ? null : lang);
      if (!heard.text && !heard.audio) continue;

      setPhase("thinking");
      const outcome = await askAgent({
        float32Audio: heard.audio,
        text: heard.text,
        language: lang,
        history: llm,
        system: SYSTEM_PROMPT,
      });

      const userText = outcome.transcript || heard.text;
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
        await speakText(em, lang, speechLocale[lang]);
        setTimeout(() => go("CONSULT"), 1400);
        return;
      }

      if (turn < MAX_TURNS - 1) {
        const reply = outcome.reply || scriptedReply(turn, lang);
        pushMsg("agent", reply);
        llm.push({ role: "assistant", content: reply });
        await speakReply(reply, detectLanguage(reply));
      }
    }

    setSymptoms(answers.join(". "));
    const closing =
      lang === "hi"
        ? "धन्यवाद। मैं अब आपको डॉक्टर से जोड़ रहा हूँ।"
        : "Thank you. Connecting you to a doctor now.";
    pushMsg("agent", closing);
    await speakReply(closing, lang);
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
    <div className="flex h-[74vh] flex-col">
      <div className="mb-3 flex items-center gap-3 rounded-t-xl border border-zinc-200 border-b-transparent bg-white px-5 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0a1a3d] text-xl">
          🩺
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-[#0a1a3d]">{t.checkupTitle}</div>
          <div className="text-xs font-medium text-zinc-500">{villager?.name}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              phase === "listening"
                ? "animate-ping bg-red-500"
                : phase === "speaking"
                  ? "animate-pulse bg-indiagreen"
                  : "bg-zinc-300"
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {statusLabel || "—"}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto border-x border-zinc-200 bg-white/70 px-5 py-4"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "agent" && (
              <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0a1a3d] text-xs text-white">
                🩺
              </span>
            )}
            <div
              className={`max-w-[76%] px-4 py-2.5 text-[17px] leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "rounded-2xl rounded-br-sm bg-[#0a1a3d] text-white"
                  : "rounded-2xl rounded-bl-sm border border-zinc-200 bg-white text-zinc-800"
              }`}
            >
              {m.text || (
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-b-xl border border-zinc-200 border-t-zinc-100 bg-white px-5 py-4">
        <div className="mb-3 flex min-h-[24px] items-center justify-center gap-3">
          {phase === "listening" && (
            <span className="flex items-center gap-2.5 rounded-full bg-red-50 px-4 py-1.5 text-red-600">
              <span className="flex items-end gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-0.5 animate-bounce rounded-full bg-red-500"
                    style={{ height: `${6 + (i % 2) * 8}px`, animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </span>
              <span className="text-sm font-bold">{statusLabel}</span>
            </span>
          )}
          {(phase === "speaking" || phase === "thinking" || phase === "loading") && (
            <span className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-1.5 text-[#0a1a3d]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#0a1a3d]" />
              <span className="text-sm font-bold">{statusLabel}</span>
            </span>
          )}
          {phase === "emergency" && (
            <span className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-1.5 text-sm font-bold text-white">
              ⚠ {t.emergencyTitle}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTyped()}
            placeholder={t.typeAnswer}
            disabled={phase !== "listening"}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-[17px] text-zinc-900 outline-none transition focus:border-[#0a1a3d] focus:ring-2 focus:ring-[#0a1a3d]/15 disabled:bg-zinc-50 disabled:text-zinc-400"
          />
          <button
            onClick={submitTyped}
            disabled={phase !== "listening" || !draft.trim()}
            className="rounded-lg bg-[#0a1a3d] px-7 py-3 text-[17px] font-bold text-white transition hover:brightness-125 disabled:opacity-30"
          >
            {t.send}
          </button>
        </div>
      </div>
    </div>
  );
}
