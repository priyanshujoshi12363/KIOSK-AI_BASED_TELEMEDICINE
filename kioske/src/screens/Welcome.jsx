import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useKiosk } from "../context/KioskContext.jsx";
import { speechLocale } from "../i18n.js";
import { speakText } from "../lib/ai.js";
import { identifyVillager } from "../lib/api.js";
import TricolorRing from "../components/TricolorRing.jsx";

export default function Welcome() {
  const { t, go } = useKiosk();
  const webcamRef = useRef(null);
  const busyRef = useRef(false);
  const phaseRef = useRef("waiting");
  const [phase, setPhase] = useState("waiting");

  useEffect(() => {
    speakText(t.standInFront, "hi", speechLocale.hi);
  }, [t.standInFront]);

  useEffect(() => {
    const id = setInterval(async () => {
      if (busyRef.current || phaseRef.current !== "waiting") return;
      const shot = webcamRef.current?.getScreenshot();
      if (!shot) return;
      busyRef.current = true;
      try {
        const res = await identifyVillager(shot);
        const facePresent = res.identified === true || res.reason === "no_match";
        if (facePresent && phaseRef.current === "waiting") {
          phaseRef.current = "greeting";
          setPhase("greeting");
          clearInterval(id);
          await speakText(t.welcomeSpoken, "hi", speechLocale.hi);
          go("SCAN");
        }
      } catch {
        // keep waiting
      } finally {
        busyRef.current = false;
      }
    }, 1800);
    return () => {
      clearInterval(id);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [go, t.welcomeSpoken]);

  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-navy shadow-sm">
        <span className="h-2 w-2 rounded-full bg-indiagreen" />
        {t.tagline}
      </span>

      <div className="relative mb-9">
        {phase === "greeting" && (
          <span className="pulse-ring absolute inset-0 rounded-full border-4 border-indiagreen" />
        )}
        <TricolorRing size={220} thickness={8}>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            mirrored
            className="h-full w-full object-cover"
            videoConstraints={{ facingMode: "user" }}
          />
        </TricolorRing>
      </div>

      <h1 className="text-6xl font-black tracking-tight text-zinc-900">{t.welcomeTitle}</h1>
      <p className="mt-5 max-w-xl text-xl leading-relaxed text-zinc-500">
        {phase === "greeting" ? t.welcomeSpoken : t.standInFront}
      </p>

      <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-white/70 px-5 py-2.5 shadow-sm">
        <span
          className={`h-3 w-3 rounded-full ${
            phase === "greeting" ? "bg-indiagreen" : "animate-ping bg-saffron"
          }`}
        />
        <span className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          {phase === "greeting" ? t.speakingLabel : t.lookingForYou}
        </span>
      </div>
    </div>
  );
}
