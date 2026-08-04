import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { useKiosk } from "../context/KioskContext.jsx";
import { identifyVillager } from "../lib/api.js";

export default function Scan() {
  const { t, go, setVillager } = useKiosk();
  const webcamRef = useRef(null);
  const busyRef = useRef(false);
  const triesRef = useRef(0);
  const [phase, setPhase] = useState("scanning");
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);

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
    if (phase !== "identified") return;
    const timer = setTimeout(() => go("AGENT"), 2600);
    return () => clearTimeout(timer);
  }, [phase, go]);

  if (phase === "identified" && result) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indiagreen/15 text-4xl">
          ✅
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-zinc-500">{t.identifiedTitle},</h2>
        <h1 className="mt-1 text-5xl font-black text-zinc-900">{result.name}</h1>
        <p className="mt-4 text-lg text-zinc-500">{t.welcomeBack}</p>
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-600">
          {t.village}: <span className="font-semibold text-zinc-800">{result.village}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-zinc-900">{t.scanTitle}</h1>
      <p className="mt-2 text-lg text-zinc-500">{t.scanHint}</p>

      <div className="relative mx-auto mt-8 h-80 w-80 overflow-hidden rounded-full border-4 border-white bg-zinc-900 shadow-2xl">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          mirrored
          className="h-full w-full object-cover"
          videoConstraints={{ facingMode: "user" }}
        />
        <div className="pulse-ring absolute inset-0 rounded-full border-4 border-saffron" />
      </div>

      <div className="mt-8 flex items-center justify-center gap-3 text-saffron">
        <span className="h-3 w-3 animate-ping rounded-full bg-saffron" />
        <span className="text-xl font-semibold">{t.scanning}</span>
      </div>

      {showHint && (
        <p className="mx-auto mt-6 max-w-lg text-sm text-zinc-400">{t.scanNotYet}</p>
      )}
    </div>
  );
}
