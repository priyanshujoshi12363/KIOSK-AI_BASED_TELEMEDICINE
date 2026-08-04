import { useEffect } from "react";
import { useKiosk } from "../context/KioskContext.jsx";

export default function Done() {
  const { t, reset } = useKiosk();

  useEffect(() => {
    const timer = setTimeout(reset, 12000);
    return () => clearTimeout(timer);
  }, [reset]);

  return (
    <div className="text-center">
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-indiagreen/15 text-5xl">
        🙏
      </div>
      <h1 className="mt-8 text-4xl font-black text-zinc-900">{t.doneTitle}</h1>
      <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-500">{t.doneHint}</p>
      <div className="mt-10">
        <button
          onClick={reset}
          className="rounded-2xl bg-zinc-900 px-12 py-5 text-2xl font-bold text-white transition hover:bg-zinc-800"
        >
          {t.finish}
        </button>
      </div>
    </div>
  );
}
