import { useEffect, useRef, useState } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { agentScript, speechLocale } from "../i18n.js";
import { speak, listenOnce, getRecognizer } from "../lib/speech.js";
import { detectLanguage } from "../lib/lang.js";

export default function Agent() {
  const { t, setLang, setSymptoms, go, villager } = useKiosk();
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState("speaking");
  const [draft, setDraft] = useState("");
  const replyResolveRef = useRef(null);
  const startedRef = useRef(false);
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

  async function agentSay(text, locale) {
    setPhase("speaking");
    setMessages((m) => [...m, { role: "agent", text }]);
    await speak(text, speechLocale[locale]);
  }

  function userReply(locale) {
    setPhase("listening");
    return new Promise((resolve) => {
      let settled = false;
      const finish = (text) => {
        if (settled) return;
        settled = true;
        replyResolveRef.current = null;
        const clean = (text || "").trim();
        if (clean) setMessages((m) => [...m, { role: "user", text: clean }]);
        resolve(clean);
      };
      replyResolveRef.current = finish;
      listenOnce(speechLocale[locale])
        .then((txt) => finish(txt))
        .catch(() => {});
    });
  }

  function submitDraft() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    if (replyResolveRef.current) replyResolveRef.current(text);
  }

  async function run() {
    let lang = "hi";
    await agentSay(agentScript.hi[0], "hi");
    const a0 = await userReply("hi");
    lang = detectLanguage(a0);
    setLang(lang);

    await agentSay(agentScript[lang][1], lang);
    const a1 = await userReply(lang);

    await agentSay(agentScript[lang][2], lang);
    const a2 = await userReply(lang);

    setSymptoms([a0, a1, a2].filter(Boolean).join(". "));
    await agentSay(agentScript[lang][3], lang);

    setPhase("done");
    setTimeout(() => go("CONSULT"), 1400);
  }

  const hasStt = !!getRecognizer();

  return (
    <div className="flex h-[70vh] flex-col">
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
                m.role === "user"
                  ? "bg-saffron text-zinc-950"
                  : "bg-zinc-100 text-zinc-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-3 flex items-center justify-center gap-3">
          {phase === "speaking" && (
            <span className="flex items-center gap-2 text-navy">
              <span className="h-3 w-3 animate-pulse rounded-full bg-navy" />
              <span className="font-semibold">{t.speakingLabel}</span>
            </span>
          )}
          {phase === "listening" && (
            <span className="flex items-center gap-2 text-red-500">
              <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
              <span className="font-semibold">{t.listeningLabel}</span>
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitDraft()}
            placeholder={t.typeAnswer}
            disabled={phase !== "listening"}
            className="flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-lg text-zinc-900 outline-none focus:border-saffron disabled:bg-zinc-50"
          />
          <button
            onClick={submitDraft}
            disabled={phase !== "listening" || !draft.trim()}
            className="rounded-xl bg-saffron px-6 py-3 text-lg font-bold text-zinc-950 disabled:opacity-40"
          >
            {t.send}
          </button>
        </div>
        {!hasStt && (
          <p className="mt-2 text-center text-xs text-zinc-400">
            Voice input not supported in this browser — please type your answer.
          </p>
        )}
      </div>
    </div>
  );
}
