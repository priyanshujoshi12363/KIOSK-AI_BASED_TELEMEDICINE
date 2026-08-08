import { useEffect, useState } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { rotatingLanguages, languages, t as translations } from "../i18n.js";
import AshokaChakra from "../components/AshokaChakra.jsx";

const ROTATE_MS = 10000;

export default function Home() {
  const { t, lang, setLang, go } = useKiosk();
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setLang((current) => {
          const i = rotatingLanguages.indexOf(current);
          return rotatingLanguages[(i + 1) % rotatingLanguages.length];
        });
        setFading(false);
      }, 320);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [setLang]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-[#2a2f7a] shadow-lg">
          <AshokaChakra size={32} className="text-white" spin />
        </div>
        <div className="text-left leading-tight">
          <div className="text-2xl font-black tracking-tight text-zinc-900">{t.brand}</div>
          <div className="text-xs font-medium text-zinc-500">{t.tagline}</div>
        </div>
      </div>

      <div
        className={`transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
      >
        <h1 className="text-5xl font-black tracking-tight text-zinc-900">{t.homeTitle}</h1>
        <p className="mt-3 text-lg text-zinc-500">{t.homeSubtitle}</p>
      </div>

      <div className="mt-9 grid w-full grid-cols-2 gap-6">
        <button
          onClick={() => go("WELCOME")}
          className="group flex flex-col items-center rounded-[28px] border-2 border-indiagreen/25 bg-white/80 px-6 py-9 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:border-indiagreen hover:shadow-2xl active:translate-y-0"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-indiagreen/12 text-6xl transition group-hover:scale-105">
            🩺
          </div>
          <div
            className={`mt-6 transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
          >
            <div className="text-3xl font-black tracking-tight text-zinc-900">
              {t.checkupTitle}
            </div>
            <div className="mt-2 text-base leading-snug text-zinc-500">{t.checkupDesc}</div>
          </div>
        </button>

        <button
          onClick={() => go("EMERGENCY")}
          className="group relative flex flex-col items-center overflow-hidden rounded-[28px] border-2 border-red-500/35 bg-gradient-to-b from-red-50 to-white px-6 py-9 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:border-red-600 hover:shadow-2xl active:translate-y-0"
        >
          <span className="pulse-ring absolute inset-0 rounded-[28px] border-4 border-red-500" />
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-red-500/12 text-6xl transition group-hover:scale-105">
            🚨
          </div>
          <div
            className={`mt-6 transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
          >
            <div className="text-3xl font-black tracking-tight text-red-600">
              {t.emergencyTitle}
            </div>
            <div className="mt-2 text-base leading-snug text-red-500/80">{t.emergencyDesc}</div>
          </div>
        </button>
      </div>

      <div className="mt-9 flex items-center gap-2">
        {rotatingLanguages.map((code) => {
          const meta = languages.find((l) => l.code === code);
          const active = code === lang;
          return (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
                active
                  ? "border-saffron bg-saffron text-zinc-950 shadow-sm"
                  : "border-zinc-200 bg-white/70 text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {meta?.native}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs font-medium tracking-wide text-zinc-400">
        {rotatingLanguages
          .map((code) => translations[code].homeSubtitle)
          .join("  ·  ")}
      </p>
    </div>
  );
}
