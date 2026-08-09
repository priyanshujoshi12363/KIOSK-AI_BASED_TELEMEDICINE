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
      <span className="mb-7 inline-flex items-center gap-2 rounded-md border border-indiagreen/30 bg-indiagreen/[0.07] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-indiagreen">
        <span className="h-1.5 w-1.5 rounded-full bg-indiagreen" />
        {t.checkupTitle}
      </span>

      <div className="relative mb-8">
        {phase === "greeting" && (
          <span className="pulse-ring absolute inset-0 rounded-full border-4 border-indiagreen" />
        )}
        <TricolorRing size={210} thickness={7}>
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

      <h1 className="text-[44px] font-bold leading-tight tracking-tight text-[#0a1a3d]">
        {t.welcomeTitle}
      </h1>
      <p className="mt-4 max-w-xl text-xl leading-relaxed text-zinc-500">
        {phase === "greeting" ? t.welcomeSpoken : t.standInFront}
      </p>

      <div className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white px-5 py-2 shadow-sm">
        <span
          className={`h-2 w-2 rounded-full ${
            phase === "greeting" ? "bg-indiagreen" : "animate-ping bg-saffron"
          }`}
        />
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
          {phase === "greeting" ? t.speakingLabel : t.lookingForYou}
        </span>
      </div>
    </div>
  );
}
