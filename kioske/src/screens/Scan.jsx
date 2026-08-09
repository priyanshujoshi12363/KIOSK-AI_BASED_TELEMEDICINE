import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { useKiosk } from "../context/KioskContext.jsx";
import { identifyVillager } from "../lib/api.js";
import { speakText } from "../lib/ai.js";
import { speechLocale } from "../i18n.js";

export default function Scan() {
  const { t, go, setVillager } = useKiosk();
  const webcamRef = useRef(null);
  const busyRef = useRef(false);
  const triesRef = useRef(0);
  const [phase, setPhase] = useState("scanning");
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    speakText(t.scanTitle, "hi", speechLocale.hi);
  }, [t.scanTitle]);

  useEffect(() => {
    if (phase !== "scanning") return;
    const id = setInterval(async () => {
      if (busyRef.current) return;
      const shot = webcamRef.current?.getScreenshot();
      if (!shot) return;
      busyRef.current = true;
      triesRef.current += 1;
      setAttempts(triesRef.current);
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
    speakText(`${t.identifiedTitle}, ${result.name}`, "hi", speechLocale.hi);
    const timer = setTimeout(() => go("AGENT"), 3000);
    return () => clearTimeout(timer);
  }, [phase, go, result, t.identifiedTitle]);

  if (phase === "identified" && result) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indiagreen">
          <span className="pulse-ring absolute inset-0 rounded-full border-4 border-indiagreen" />
          <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="none" strokeWidth="3" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="mt-7 text-lg font-medium text-zinc-500">{t.identifiedTitle},</p>
        <h1 className="mt-1 text-[44px] font-bold leading-tight tracking-tight text-[#0a1a3d]">
          {result.name}
        </h1>

        <div className="mt-6 flex items-center gap-6 rounded-xl border border-zinc-200 bg-white px-8 py-4 shadow-sm">
          <div className="text-left">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              {t.village}
            </div>
            <div className="mt-0.5 text-lg font-bold text-[#0a1a3d]">{result.village}</div>
          </div>
          {result.aadhaarLast4 && (
            <>
              <span className="h-9 w-px bg-zinc-200" />
              <div className="text-left">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Aadhaar
                </div>
                <div className="mt-0.5 font-mono text-lg font-bold text-[#0a1a3d]">
                  ···· {result.aadhaarLast4}
                </div>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-base text-zinc-500">{t.welcomeBack}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-[34px] font-bold tracking-tight text-[#0a1a3d]">{t.scanTitle}</h1>
      <p className="mt-2 text-lg text-zinc-500">{t.scanHint}</p>

      <div className="relative mt-8">
        <div className="relative h-[300px] w-[300px] overflow-hidden rounded-2xl border-2 border-zinc-300 bg-zinc-900 shadow-lg">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            mirrored
            className="h-full w-full object-cover"
            videoConstraints={{ facingMode: "user" }}
          />

          <span className="absolute left-5 top-5 h-9 w-9 border-l-[3px] border-t-[3px] border-saffron" />
          <span className="absolute right-5 top-5 h-9 w-9 border-r-[3px] border-t-[3px] border-saffron" />
          <span className="absolute bottom-5 left-5 h-9 w-9 border-b-[3px] border-l-[3px] border-saffron" />
          <span className="absolute bottom-5 right-5 h-9 w-9 border-b-[3px] border-r-[3px] border-saffron" />

          <span className="scanline absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-saffron to-transparent" />
        </div>

        <div className="absolute -bottom-3.5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2 shadow-md">
          <span className="h-2 w-2 animate-ping rounded-full bg-saffron" />
          <span className="text-sm font-bold text-[#0a1a3d]">{t.scanning}</span>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 w-8 rounded-full transition-colors duration-300 ${
              i < attempts % 5 ? "bg-saffron" : "bg-zinc-200"
            }`}
          />
        ))}
      </div>

      {showHint && (
        <p className="mx-auto mt-5 max-w-md rounded-lg border border-saffron/30 bg-saffron/[0.07] px-5 py-3 text-sm leading-relaxed text-zinc-600">
          {t.scanNotYet}
        </p>
      )}
    </div>
  );
}
