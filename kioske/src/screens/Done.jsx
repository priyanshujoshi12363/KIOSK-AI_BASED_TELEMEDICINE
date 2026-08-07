import { useEffect } from "react";
import { useKiosk } from "../context/KioskContext.jsx";

export default function Done() {
  const { t, reset } = useKiosk();

  useEffect(() => {
    const timer = setTimeout(reset, 12000);
    return () => clearTimeout(timer);
  }, [reset]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-indiagreen/15 text-6xl shadow-sm animate-float">
        🙏
      </div>
      <h1 className="mt-8 text-5xl font-black tracking-tight text-zinc-900">{t.doneTitle}</h1>
      <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-zinc-500">{t.doneHint}</p>
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
