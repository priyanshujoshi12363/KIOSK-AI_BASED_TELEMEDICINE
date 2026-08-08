import { useEffect, useRef, useState } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { speechLocale } from "../i18n.js";
import { speak } from "../lib/speech.js";
import { detectLanguage } from "../lib/lang.js";
import { transcribe, preloadWhisper } from "../lib/whisper.js";
import { recordUntilSilence } from "../lib/audio.js";
import { analyzeEmergency } from "../lib/emergency.js";
import { getLocation, kioskVillage } from "../lib/geo.js";
import { sendEmergency } from "../lib/api.js";
import { STT_ENABLED } from "../lib/aiConfig.js";
import VoiceOrb from "../components/VoiceOrb.jsx";

const CATEGORY_LABEL = {
  CARDIAC: "Cardiac / Heart",
  BREATHING: "Breathing",
  STROKE: "Stroke",
  UNCONSCIOUS: "Unconscious",
  SEIZURE: "Seizure",
  POISONING: "Poisoning / Bite",
  BLEEDING: "Bleeding",
  CHILDBIRTH: "Childbirth",
  BURN: "Burns",
  INJURY: "Injury / Accident",
  OTHER: "Emergency",
};

export default function Emergency() {
  const { t, lang, setLang, go, villager } = useKiosk();
  const [phase, setPhase] = useState("starting");
  const [heard, setHeard] = useState("");
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState(null);
  const levelRef = useRef(0);
  const startedRef = useRef(false);
  const locationRef = useRef(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    preloadWhisper();
    getLocation().then((loc) => {
      locationRef.current = loc;
      setLocation(loc);
    });

    (async () => {
      await speak(t.emSpokenPrompt, speechLocale[lang]);
      listen();
    })();

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  async function listen() {
    submittedRef.current = false;
    setPhase("listening");
    try {
      const { audio } = await recordUntilSilence({
        maxMs: STT_ENABLED ? 15000 : 7000,
        onLevel: (v) => {
          levelRef.current = v;
        },
      });
      levelRef.current = 0;
      if (submittedRef.current) return;
      if (!audio || !STT_ENABLED) {
        setPhase("waitingText");
        return;
      }
      setPhase("analyzing");
      const text = await transcribe(audio, lang);
      if (submittedRef.current) return;
      if (!text) {
        setPhase("waitingText");
        return;
      }
      submit(text);
    } catch {
      if (!submittedRef.current) setPhase("waitingText");
    }
  }

  async function submit(text) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setHeard(text);
    setPhase("analyzing");

    const spoken = detectLanguage(text);
    if (spoken) setLang(spoken);

    const analysis = await analyzeEmergency(text);
    setResult(analysis);
    setPhase("sending");

    const loc = locationRef.current ?? (await getLocation());
    if (loc && !locationRef.current) {
      locationRef.current = loc;
      setLocation(loc);
    }

    const res = await sendEmergency({
      transcript: text,
      language: spoken || lang,
      category: analysis.category,
      severity: analysis.severity,
      patient: analysis.patient,
      summary: analysis.summary || "",
      matched: analysis.matched,
      village: villager?.village || kioskVillage || "",
      villagerId: villager?.id || null,
      location: loc,
    });

    if (!res.ok) {
      submittedRef.current = false;
      setPhase("failed");
      return;
    }

    setPhase("sent");
    speak(t.emSentSpoken, speechLocale[spoken || lang]);
  }

  function submitTyped() {
    const v = draft.trim();
    if (!v) return;
    setDraft("");
    submit(v);
  }

  if (phase === "sent") {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-indiagreen/15 text-6xl shadow-sm">
          ✅
        </div>
        <h1 className="mt-7 text-5xl font-black tracking-tight text-zinc-900">{t.emSentTitle}</h1>
        <p className="mt-4 max-w-xl text-xl leading-relaxed text-zinc-600">{t.emSentHint}</p>

        <div className="mt-7 w-full max-w-lg rounded-3xl border border-zinc-200 bg-white/80 p-5 text-left shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              {t.emDetected}
            </span>
            <span className="rounded-full bg-red-500/12 px-3 py-1 text-sm font-bold text-red-600">
              {CATEGORY_LABEL[result?.category] || CATEGORY_LABEL.OTHER} · {result?.severity}
            </span>
          </div>
          <p className="mt-3 text-lg text-zinc-800">{result?.summary || heard}</p>
          <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3 text-sm">
            <span className={location ? "text-indiagreen" : "text-zinc-400"}>
              {location ? "📍" : "○"}
            </span>
            <span className={location ? "font-semibold text-indiagreen" : "text-zinc-400"}>
              {location ? t.emLocationOn : t.emLocationOff}
            </span>
            {location && (
              <span className="ml-auto font-mono text-xs text-zinc-400">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            )}
          </div>
        </div>

        <p className="mt-6 max-w-lg text-base font-semibold text-red-600">{t.emStayCalm}</p>
        <p className="mt-1 text-sm font-bold tracking-wide text-red-500">{t.emCall108}</p>
      </div>
    );
  }

  const busy = phase === "analyzing" || phase === "sending";

  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-red-600">
        <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
        {t.emergencyTitle}
      </span>

      <h1 className="text-4xl font-black tracking-tight text-zinc-900">{t.emTitle}</h1>
      <p className="mt-2 text-lg text-zinc-500">{t.emPrompt}</p>

      <div className="mt-6">
        <VoiceOrb levelRef={levelRef} active={phase === "listening"} size={240} />
      </div>

      <div className="mt-5 flex min-h-[32px] items-center gap-2">
        {phase === "listening" && (
          <span className="flex items-center gap-2 text-lg font-bold text-red-600">
            <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
            {t.emListening}
          </span>
        )}
        {phase === "analyzing" && (
          <span className="text-lg font-bold text-navy">{t.emAnalyzing}</span>
        )}
        {phase === "sending" && (
          <span className="text-lg font-bold text-navy">{t.emSending}</span>
        )}
        {phase === "failed" && (
          <span className="text-lg font-bold text-red-600">{t.emFailed}</span>
        )}
      </div>

      {heard && (
        <p className="mt-1 max-w-xl rounded-2xl bg-white/70 px-5 py-3 text-lg text-zinc-700 shadow-sm">
          “{heard}”
        </p>
      )}

      <div className="mt-6 flex w-full max-w-xl gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitTyped()}
          placeholder={t.emTypeHere}
          disabled={busy}
          className="flex-1 rounded-2xl border-2 border-zinc-200 bg-white/80 px-5 py-3.5 text-lg text-zinc-900 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/25 disabled:bg-zinc-50"
        />
        <button
          onClick={submitTyped}
          disabled={busy || !draft.trim()}
          className="rounded-2xl bg-gradient-to-br from-red-500 to-red-700 px-7 py-3.5 text-lg font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
        >
          {t.send}
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={listen}
          disabled={phase === "listening" || busy}
          className="rounded-full border-2 border-red-300 bg-white/80 px-6 py-2.5 text-base font-bold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-40"
        >
          🎙️ {phase === "waitingText" || phase === "failed" ? t.emSpeakAgain : t.emStart}
        </button>
        <button
          onClick={() => go("HOME")}
          className="rounded-full border border-zinc-300 bg-white/70 px-6 py-2.5 text-base font-medium text-zinc-600 transition hover:bg-white"
        >
          {t.emBack}
        </button>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm">
        <span className={location ? "text-indiagreen" : "text-zinc-400"}>
          {location ? "📍" : "○"}
        </span>
        <span className={location ? "font-semibold text-indiagreen" : "text-zinc-400"}>
          {location ? t.emLocationOn : t.emLocating}
        </span>
      </div>
    </div>
  );
}
