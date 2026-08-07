import { useEffect } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { speak } from "../lib/speech.js";
import { speechLocale } from "../i18n.js";

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function Done() {
  const { t, reset, session, lang } = useKiosk();
  const pickup = formatTime(session?.pickupAfter);

  useEffect(() => {
    speak(t.doneHint, speechLocale[lang] || speechLocale.hi);
    const timer = setTimeout(reset, 20000);
    return () => clearTimeout(timer);
  }, [reset, t.doneHint, lang]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-indiagreen/15 text-6xl shadow-sm animate-float">
        🙏
      </div>
      <h1 className="mt-8 text-5xl font-black tracking-tight text-zinc-900">{t.doneTitle}</h1>
      <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-zinc-500">{t.doneHint}</p>

      {pickup && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-indiagreen/30 bg-indiagreen/10 px-6 py-3">
          <span className="text-2xl">💊</span>
          <span className="text-left">
            <span className="block text-sm text-zinc-600">{t.pickupLabel}</span>
            <span className="block text-xl font-bold text-indiagreen">{pickup}</span>
          </span>
        </div>
      )}

      <div className="mt-10">
        <button
          onClick={reset}
          className="rounded-2xl bg-gradient-to-br from-navy to-[#2a2f7a] px-12 py-5 text-2xl font-bold text-white shadow-lg transition hover:brightness-110"
        >
          {t.finish}
        </button>
      </div>
    </div>
  );
}
