import { useEffect } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { speechLocale } from "../i18n.js";
import { speak } from "../lib/speech.js";
import AshokaChakra from "../components/AshokaChakra.jsx";

export default function Welcome() {
  const { t, go } = useKiosk();

  useEffect(() => {
    speak(t.introText, speechLocale.hi);
    const timer = setTimeout(() => go("SCAN"), 6500);
    return () => {
      clearTimeout(timer);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [go, t.introText]);

  return (
    <div className="text-center">
      <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-saffron/20 to-indiagreen/20 text-navy">
        <AshokaChakra size={72} spin />
      </div>
      <h1 className="text-4xl font-black tracking-tight text-zinc-900">{t.introTitle}</h1>
      <p className="mx-auto mt-5 max-w-2xl text-xl leading-relaxed text-zinc-500">
        {t.introText}
      </p>

      <div className="mt-10 flex items-center justify-center gap-2 text-saffron">
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-saffron [animation-delay:-0.3s]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-saffron [animation-delay:-0.15s]" />
        <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-saffron" />
      </div>
      <p className="mt-4 text-sm font-medium uppercase tracking-widest text-zinc-400">
        {t.starting}
      </p>
    </div>
  );
}
