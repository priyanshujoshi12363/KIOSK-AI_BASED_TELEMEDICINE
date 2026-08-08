import { useEffect, useRef, useState } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { createSession, saveDraftPrescription } from "../lib/api.js";
import { getLocation } from "../lib/geo.js";
import { transcribeAudio } from "../lib/ai.js";
import { extractPrescription } from "../lib/prescriptionAI.js";
import { decodeToFloat32 } from "../lib/audio.js";
import AshokaChakra from "../components/AshokaChakra.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Consult() {
  const { t, go, villager, symptoms, lang, redFlags, session, setSession, setPrescription } =
    useKiosk();
  const [phase, setPhase] = useState("creating");
  const [note, setNote] = useState("");
  const startedRef = useRef(false);
  const frameRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const location = await getLocation();
        const res = await createSession({
          villagerId: villager?.id,
          symptoms,
          language: lang,
          redFlags,
          location,
        });
        if (res.status === 201 && res.session) {
          setSession(res.session);
          sessionRef.current = res.session;
          setPhase("ready");
        } else {
          setPhase("error");
        }
      } catch {
        setPhase("error");
      }
    })();
  }, [villager, symptoms, lang, redFlags, setSession]);

  useEffect(() => {
    async function onMessage(event) {
      const data = event.data;
      if (!data || data.type !== "consult-audio" || !data.audio) return;

      const current = sessionRef.current;
      if (!current) return;

      setPhase("summarising");
      try {
        const float32 = await decodeToFloat32(data.audio, data.mime);
        setNote(t.rxTranscribing);
        const { text } = await transcribeAudio(float32, lang);

        setNote(t.rxExtracting);
        const draft = await extractPrescription(text);

        await saveDraftPrescription({
          sessionId: current.id,
          medicines: draft.medicines,
          advice: draft.advice,
          diagnosis: draft.diagnosis,
          keyPoints: draft.keyPoints,
          followUp: draft.followUp,
          transcript: draft.transcript,
        });

        setPrescription(draft);
      } catch {
        setNote("");
      }
      go("DONE");
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [go, lang, setPrescription, t]);

  function endCall() {
    const frame = frameRef.current;
    if (frame && frame.contentWindow) {
      setPhase("summarising");
      setNote(t.rxListening);
      frame.contentWindow.postMessage({ type: "end-consult" }, "*");
      setTimeout(() => {
        if (sessionRef.current) go("DONE");
      }, 25000);
      return;
    }
    go("DONE");
  }

  if (phase === "summarising") {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-navy to-[#2a2f7a] text-white shadow-lg animate-float">
          <AshokaChakra size={68} spin />
        </div>
        <h1 className="mt-8 text-3xl font-black tracking-tight text-zinc-900">{t.rxBuilding}</h1>
        <p className="mt-3 text-lg text-zinc-500">{note || t.rxBuildingHint}</p>
        <div className="mt-8 flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-saffron [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-navy [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-indiagreen" />
        </div>
      </div>
    );
  }

  if (phase === "ready" && session) {
    const videoUrl = `${API}/video.html?session=${session.id}&role=patient`;
    return (
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">{t.consultTitle}</h1>
        <p className="mt-2 text-lg text-zinc-500">{t.consultHint}</p>
        <div className="mt-6 w-full max-w-2xl overflow-hidden rounded-3xl border-4 border-white bg-zinc-900 shadow-2xl">
          <iframe
            ref={frameRef}
            title="consult"
            src={videoUrl}
            allow="camera; microphone; autoplay"
            className="h-[46vh] w-full"
          />
        </div>
        <button
          onClick={endCall}
          className="mt-8 rounded-2xl bg-gradient-to-br from-saffron to-[#ff8a1f] px-12 py-4 text-xl font-bold text-zinc-950 shadow-lg transition hover:brightness-105"
        >
          {t.finish}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-navy to-[#2a2f7a] text-white shadow-lg animate-float">
        <AshokaChakra size={68} spin />
      </div>
      <h1 className="mt-8 text-3xl font-black tracking-tight text-zinc-900">{t.consultTitle}</h1>
      <p className="mt-3 text-lg text-zinc-500">
        {phase === "error" ? "Saved. A doctor will consult you shortly." : t.consultHint}
      </p>
      <div className="mt-10">
        <button
          onClick={() => go("DONE")}
          disabled={phase === "creating"}
          className="rounded-2xl bg-gradient-to-br from-saffron to-[#ff8a1f] px-12 py-5 text-2xl font-bold text-zinc-950 shadow-lg transition hover:brightness-105 disabled:opacity-50"
        >
          {phase === "creating" ? "…" : t.finish}
        </button>
      </div>
    </div>
  );
}
