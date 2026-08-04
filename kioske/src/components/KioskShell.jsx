import TricolorBar from "./TricolorBar.jsx";
import AshokaChakra from "./AshokaChakra.jsx";
import { useKiosk, STEPS } from "../context/KioskContext.jsx";
import { languages } from "../i18n.js";

export default function KioskShell({ children }) {
  const { t, lang, step, reset } = useKiosk();
  const langClass = lang === "hi" ? "lang-hi" : lang === "ml" ? "lang-ml" : "";
  const stepIndex = STEPS.indexOf(step);
  const activeLang = languages.find((l) => l.code === lang);

  return (
    <div className={`flex h-full flex-col ${langClass}`}>
      <TricolorBar />
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <AshokaChakra size={44} className="text-navy" />
          <div className="leading-tight">
            <div className="text-lg font-extrabold text-zinc-900">{t.brand}</div>
            <div className="text-xs text-zinc-500">{t.tagline}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {step !== "WELCOME" && (
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-semibold text-zinc-700">
              {activeLang?.native}
            </span>
          )}
          {step !== "WELCOME" && (
            <button
              onClick={reset}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              {t.home}
            </button>
          )}
        </div>
      </header>

      {stepIndex > 0 && (
        <div className="flex justify-center gap-2 bg-white/40 py-3">
          {STEPS.slice(1).map((s, i) => (
            <span
              key={s}
              className={`h-2 rounded-full transition-all ${
                i + 1 <= stepIndex ? "w-10 bg-saffron" : "w-6 bg-zinc-200"
              }`}
            />
          ))}
        </div>
      )}

      <main className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-6">
        <div className="w-full max-w-3xl animate-fade-in">{children}</div>
      </main>

      <TricolorBar />
    </div>
  );
}
