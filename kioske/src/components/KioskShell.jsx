import { useEffect, useState } from "react";
import TricolorBar from "./TricolorBar.jsx";
import AshokaChakra from "./AshokaChakra.jsx";
import KioskBackground from "./KioskBackground.jsx";
import { useKiosk } from "../context/KioskContext.jsx";
import { languages } from "../i18n.js";
import { isOnline } from "../lib/ai.js";

const FLOW = ["SCAN", "AGENT", "CONSULT", "DONE"];
const KIOSK_ID = import.meta.env.VITE_KIOSK_LABEL || "";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function KioskShell({ children }) {
  const { t, lang, step, reset } = useKiosk();
  const [online, setOnline] = useState(true);
  const now = useClock();

  const langClass =
    lang === "hi" ? "lang-hi" : lang === "ml" ? "lang-ml" : lang === "gu" ? "lang-gu" : "";
  const flowIndex = FLOW.indexOf(step);
  const activeLang = languages.find((l) => l.code === lang);
  const atHome = step === "HOME";

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const value = await isOnline().catch(() => false);
      if (alive) setOnline(Boolean(value));
    };
    check();
    const id = setInterval(check, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className={`flex h-full flex-col bg-[#f4f6fb] ${langClass}`}>
      <KioskBackground />

      <div className="flex items-center justify-between bg-[#0a1a3d] px-6 py-1.5 text-[11px] font-medium text-white/70">
        <span className="tracking-wide">भारत सरकार · GOVERNMENT OF INDIA</span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${online ? "bg-indiagreen" : "bg-saffron"}`}
            />
            {online ? t.statusOnline : t.statusOffline}
          </span>
          {KIOSK_ID && <span className="hidden sm:inline">{t.kioskLabel}: {KIOSK_ID}</span>}
          <span className="tabular-nums">{date} · {time}</span>
        </span>
      </div>

      <header className="border-b border-zinc-200 bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0a1a3d] shadow">
              <AshokaChakra size={28} className="text-white" spin />
            </div>
            <div className="leading-tight">
              <div className="text-[17px] font-bold tracking-tight text-[#0a1a3d]">
                {t.tagline}
              </div>
              <div className="text-[11.5px] font-medium text-zinc-500">{t.dept}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="rounded border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-[#0a1a3d]">
              {activeLang?.native}
            </span>
            {!atHome && (
              <button
                onClick={reset}
                className="rounded border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                {t.home}
              </button>
            )}
          </div>
        </div>
      </header>

      <TricolorBar height={3} />

      {flowIndex >= 0 && (
        <div className="border-b border-zinc-200/70 bg-white/60 py-2.5">
          <div className="mx-auto flex max-w-md items-center gap-1.5 px-6">
            {FLOW.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-1.5">
                <span
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i < flowIndex
                      ? "bg-indiagreen"
                      : i === flowIndex
                        ? "bg-saffron"
                        : "bg-zinc-200"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-6">
        <div className="w-full max-w-3xl animate-fade-in">{children}</div>
      </main>

      <footer className="border-t border-zinc-200 bg-white px-6 py-2.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-[11px] text-zinc-500">
          <span className="font-medium">{t.poweredBy}</span>
          <span className="flex items-center gap-4">
            <span>
              {t.helpline} <strong className="text-[#0a1a3d]">104</strong>
            </span>
            <span>
              {t.emergencyNumber} <strong className="text-red-600">108</strong>
            </span>
          </span>
        </div>
      </footer>

      <TricolorBar height={4} />
    </div>
  );
}
