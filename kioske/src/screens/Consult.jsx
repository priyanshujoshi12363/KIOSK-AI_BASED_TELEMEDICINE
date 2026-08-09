import { useEffect, useRef, useState } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { createSession } from "../lib/api.js";
import { getLocation } from "../lib/geo.js";
import AshokaChakra from "../components/AshokaChakra.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Consult() {
  const { t, go, villager, symptoms, lang, redFlags, session, setSession } = useKiosk();
  const [phase, setPhase] = useState("creating");
  const startedRef = useRef(false);

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
          setPhase("ready");
        } else {
          setPhase("error");
        }
      } catch {
        setPhase("error");
      }
    })();
  }, [villager, symptoms, lang, redFlags, setSession]);

  if (phase === "ready" && session) {
    const videoUrl = `${API}/video.html?session=${session.id}&role=patient`;
    return (
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">{t.consultTitle}</h1>
        <p className="mt-2 text-lg text-zinc-500">{t.consultHint}</p>
        <div className="mt-6 w-full max-w-2xl overflow-hidden rounded-3xl border-4 border-white bg-zinc-900 shadow-2xl">
          <iframe
            title="consult"
            src={videoUrl}
            allow="camera; microphone; autoplay"
            className="h-[46vh] w-full"
          />
        </div>
        <button
          onClick={() => go("DONE")}
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
