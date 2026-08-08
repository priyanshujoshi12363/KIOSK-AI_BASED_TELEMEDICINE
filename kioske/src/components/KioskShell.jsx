import TricolorBar from "./TricolorBar.jsx";
import AshokaChakra from "./AshokaChakra.jsx";
import KioskBackground from "./KioskBackground.jsx";
import { useKiosk } from "../context/KioskContext.jsx";
import { languages } from "../i18n.js";

const FLOW = ["SCAN", "AGENT", "CONSULT", "DONE"];

export default function KioskShell({ children }) {
  const { t, lang, step, reset } = useKiosk();
  const langClass =
    lang === "hi" ? "lang-hi" : lang === "ml" ? "lang-ml" : lang === "gu" ? "lang-gu" : "";
  const flowIndex = FLOW.indexOf(step);
  const activeLang = languages.find((l) => l.code === lang);
  const atHome = step === "HOME";

  return (
    <div className={`flex h-full flex-col ${langClass}`}>
      <KioskBackground />
      <TricolorBar height={5} />
      {!atHome && (
        <header className="glass flex items-center justify-between border-b border-white/40 px-6 py-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-[#2a2f7a] shadow-md">
              <AshokaChakra size={26} className="text-white" spin />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight text-zinc-900">{t.brand}</div>
              <div className="text-[11px] font-medium text-zinc-500">{t.tagline}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-sm font-semibold text-navy shadow-sm">
              {activeLang?.native}
            </span>
            <button
              onClick={reset}
              className="rounded-full border border-zinc-300 bg-white/70 px-4 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-900"
            >
              {t.home}
            </button>
          </div>
        </header>
      )}

      {flowIndex >= 0 && (
        <div className="flex justify-center gap-2 py-3.5">
          {FLOW.map((s, i) => (
            <span
              key={s}
              className={`h-2 rounded-full transition-all duration-500 ${
                i < flowIndex
                  ? "w-8 bg-indiagreen"
                  : i === flowIndex
                    ? "w-12 bg-saffron"
                    : "w-6 bg-zinc-200"
              }`}
            />
          ))}
        </div>
      )}

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-6">
        <div className="w-full max-w-3xl animate-fade-in">{children}</div>
      </main>

      <TricolorBar height={5} />
    </div>
  );
}
