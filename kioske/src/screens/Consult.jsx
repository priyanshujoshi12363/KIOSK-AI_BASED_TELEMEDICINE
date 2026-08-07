import { useKiosk } from "../context/KioskContext.jsx";
import AshokaChakra from "../components/AshokaChakra.jsx";

export default function Consult() {
  const { t, go, villager, symptoms } = useKiosk();

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-navy to-[#2a2f7a] text-white shadow-lg animate-float">
        <AshokaChakra size={68} spin />
      </div>
      <h1 className="mt-8 text-3xl font-black tracking-tight text-zinc-900">{t.consultTitle}</h1>
      <p className="mt-3 text-lg text-zinc-500">{t.consultHint}</p>

      <div className="glass mx-auto mt-8 w-full max-w-lg rounded-3xl p-6 text-left shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200/70 pb-3">
          <span className="text-sm font-semibold text-navy">{villager?.name}</span>
          <span className="text-sm text-zinc-500">
            {t.village}: {villager?.village}
          </span>
        </div>
        <p className="mt-3 text-base text-zinc-700">{symptoms}</p>
      </div>

      <p className="mt-4 text-sm text-zinc-400">{t.consultNote}</p>

      <div className="mt-10">
        <button
          onClick={() => go("DONE")}
          className="rounded-2xl bg-gradient-to-br from-saffron to-[#ff8a1f] px-12 py-5 text-2xl font-bold text-zinc-950 shadow-lg transition hover:brightness-105"
        >
          {t.finish}
        </button>
      </div>
    </div>
  );
}
