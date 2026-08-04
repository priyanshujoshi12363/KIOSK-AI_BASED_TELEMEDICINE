import { useKiosk } from "../context/KioskContext.jsx";
import AshokaChakra from "../components/AshokaChakra.jsx";

export default function Consult() {
  const { t, go, villager, symptoms } = useKiosk();

  return (
    <div className="text-center">
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-navy/10 text-navy">
        <AshokaChakra size={72} spin />
      </div>
      <h1 className="mt-8 text-3xl font-bold text-zinc-900">{t.consultTitle}</h1>
      <p className="mt-3 text-lg text-zinc-500">{t.consultHint}</p>

      <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <span className="text-sm text-zinc-400">{villager?.name}</span>
          <span className="text-sm text-zinc-400">
            {t.village}: {villager?.village}
          </span>
        </div>
        <p className="mt-3 text-base text-zinc-700">{symptoms}</p>
      </div>

      <p className="mt-4 text-sm text-zinc-400">{t.consultNote}</p>

      <div className="mt-10">
        <button
          onClick={() => go("DONE")}
          className="rounded-2xl bg-saffron px-12 py-5 text-2xl font-bold text-zinc-950 shadow-lg transition hover:bg-saffron/90"
        >
          {t.finish}
        </button>
      </div>
    </div>
  );
}
