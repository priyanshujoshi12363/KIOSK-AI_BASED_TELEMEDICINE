import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { useKiosk } from "../context/KioskContext.jsx";
import { identifyVillager } from "../lib/api.js";
import { speak } from "../lib/speech.js";
import { speechLocale } from "../i18n.js";
import TricolorRing from "../components/TricolorRing.jsx";

export default function Scan() {
  const { t, go, setVillager } = useKiosk();
  const webcamRef = useRef(null);
  const busyRef = useRef(false);
  const triesRef = useRef(0);
  const [phase, setPhase] = useState("scanning");
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    speak(t.scanTitle, speechLocale.hi);
  }, [t.scanTitle]);

  useEffect(() => {
    if (phase !== "scanning") return;
    const id = setInterval(async () => {
      if (busyRef.current) return;
      const shot = webcamRef.current?.getScreenshot();
      if (!shot) return;
      busyRef.current = true;
      triesRef.current += 1;
      try {
        const res = await identifyVillager(shot);
        if (res.identified) {
          setResult(res.villager);
          setVillager(res.villager);
          setPhase("identified");
        } else if (triesRef.current >= 4) {
          setShowHint(true);
        }
      } catch {
        if (triesRef.current >= 4) setShowHint(true);
      } finally {
        busyRef.current = false;
      }
    }, 2500);
    return () => clearInterval(id);
  }, [phase, setVillager]);

  useEffect(() => {
    if (phase !== "identified" || !result) return;
    speak(`${t.identifiedTitle}, ${result.name}`, speechLocale.hi);
    const timer = setTimeout(() => go("AGENT"), 3000);
    return () => clearTimeout(timer);
  }, [phase, go, result, t.identifiedTitle]);

  if (phase === "identified" && result) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indiagreen/15 text-5xl shadow-sm">
          ✅
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-zinc-500">{t.identifiedTitle},</h2>
        <h1 className="mt-1 text-5xl font-black tracking-tight text-zinc-900">{result.name}</h1>
        <p className="mt-4 text-lg text-zinc-500">{t.welcomeBack}</p>
        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-5 py-2 text-sm text-zinc-600 shadow-sm">
          {t.village}: <span className="font-bold text-navy">{result.village}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-4xl font-black tracking-tight text-zinc-900">{t.scanTitle}</h1>
      <p className="mt-3 text-lg text-zinc-500">{t.scanHint}</p>

      <div className="relative mx-auto mt-9">
        <span className="pulse-ring absolute inset-0 rounded-full border-4 border-saffron" />
        <TricolorRing size={300} thickness={9}>
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

      <div className="mt-9 inline-flex items-center gap-3 rounded-full bg-white/70 px-6 py-3 shadow-sm">
        <span className="h-3 w-3 animate-ping rounded-full bg-saffron" />
        <span className="text-xl font-bold text-navy">{t.scanning}</span>
      </div>

      {showHint && (
        <p className="mx-auto mt-6 max-w-lg text-sm text-zinc-400">{t.scanNotYet}</p>
      )}
    </div>
  );
}
