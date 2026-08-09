import { useEffect, useState } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { rotatingLanguages, languages } from "../i18n.js";

const ROTATE_MS = 5000;
const FADE_MS = 260;

export default function Home() {
  const { t, lang, setLang, go } = useKiosk();
  const [fading, setFading] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (manual) return;
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setLang((current) => {
          const i = rotatingLanguages.indexOf(current);
          return rotatingLanguages[(i + 1) % rotatingLanguages.length];
        });
        setFading(false);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [setLang, manual]);

  const fade = `transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`;

  return (
    <div className="flex flex-col items-center">
      <div className={`text-center ${fade}`}>
        <h1 className="text-[42px] font-bold leading-tight tracking-tight text-[#0a1a3d]">
          {t.homeTitle}
        </h1>
        <p className="mt-2 text-lg text-zinc-500">{t.homeSubtitle}</p>
      </div>

      <div className="mt-8 grid w-full grid-cols-2 gap-5">
        <button
          onClick={() => go("WELCOME")}
          className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-7 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indiagreen/50 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indiagreen/20"
        >
          <span className="absolute inset-x-0 top-0 h-1 bg-indiagreen" />
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indiagreen/10 text-4xl">
            🩺
          </div>
          <div className={`mt-5 ${fade}`}>
            <div className="text-[26px] font-bold leading-snug tracking-tight text-[#0a1a3d]">
              {t.checkupTitle}
            </div>
            <div className="mt-1.5 text-[15px] leading-snug text-zinc-500">{t.checkupDesc}</div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-indiagreen">
            <span className="h-1.5 w-1.5 rounded-full bg-indiagreen" />
            <span className={fade}>{t.homeSubtitle}</span>
            <span className="ml-auto text-lg transition-transform group-hover:translate-x-1">→</span>
          </div>
        </button>

        <button
          onClick={() => go("EMERGENCY")}
          className="group relative flex flex-col overflow-hidden rounded-xl border border-red-200 bg-white p-7 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-400 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/20"
        >
          <span className="absolute inset-x-0 top-0 h-1 bg-red-600" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-lg bg-red-50 text-4xl">
            <span className="pulse-ring absolute inset-0 rounded-lg border-2 border-red-500" />
            🚨
          </div>
          <div className={`mt-5 ${fade}`}>
            <div className="text-[26px] font-bold leading-snug tracking-tight text-red-700">
              {t.emergencyTitle}
            </div>
            <div className="mt-1.5 text-[15px] leading-snug text-zinc-500">{t.emergencyDesc}</div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-red-600">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-red-500" />
            <span>108</span>
            <span className="ml-auto text-lg transition-transform group-hover:translate-x-1">→</span>
          </div>
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          भाषा · Language · ભાષા
        </span>
        <div className="flex items-center gap-2">
          {rotatingLanguages.map((code) => {
            const meta = languages.find((l) => l.code === code);
            const active = code === lang;
            return (
              <button
                key={code}
                onClick={() => {
                  setManual(true);
                  setFading(false);
                  setLang(code);
                }}
                className={`rounded-md border px-5 py-2 text-[15px] font-semibold transition ${
                  active
                    ? "border-[#0a1a3d] bg-[#0a1a3d] text-white shadow-sm"
                    : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                }`}
              >
                {meta?.native}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
