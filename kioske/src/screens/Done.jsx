import { useEffect, useRef, useState } from "react";
import { useKiosk } from "../context/KioskContext.jsx";
import { speakText } from "../lib/ai.js";
import { speechLocale } from "../i18n.js";
import { getSessionPrescription } from "../lib/api.js";
import { savePrescriptionPDF } from "../lib/rxDocument.js";

const POLL_MS = 6000;

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function Done() {
  const { t, reset, session, lang, villager, prescription, setPrescription } = useKiosk();
  const [confirmed, setConfirmed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const spokenRef = useRef(false);

  const pickup = formatTime(session?.pickupAfter);
  const rx = confirmed || prescription;
  const meds = rx?.medicines || [];

  useEffect(() => {
    if (spokenRef.current) return;
    spokenRef.current = true;
    speakText(t.doneHint, lang, speechLocale[lang] || speechLocale.hi);
  }, [t.doneHint, lang]);

  useEffect(() => {
    if (!session?.id) return;
    let stop = false;

    async function poll() {
      const res = await getSessionPrescription(session.id).catch(() => null);
      if (stop) return;
      if (res?.ok && res.prescription) {
        setPrescription(res.prescription);
        if (res.prescription.status === "CONFIRMED") {
          setConfirmed(res.prescription);
          return;
        }
      }
      setTimeout(poll, POLL_MS);
    }

    poll();
    return () => {
      stop = true;
    };
  }, [session, setPrescription]);

  async function download() {
    setSaving(true);
    const res = await savePrescriptionPDF({
      prescription: rx,
      villager,
      doctor: rx?.doctor,
      session,
      kiosk: import.meta.env.VITE_KIOSK_LABEL || "",
    });
    setSaving(false);
    setSaved(res?.ok ? res.path || "downloaded" : null);
  }

  return (
    <div className="flex w-full flex-col items-center text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indiagreen/15 text-4xl shadow-sm">
        🙏
      </div>
      <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-900">{t.doneTitle}</h1>
      <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-zinc-500">{t.doneHint}</p>

      {rx && (
        <div className="mt-6 w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white/85 p-5 text-left shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              {t.rxTitle}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                confirmed
                  ? "bg-indiagreen/12 text-indiagreen"
                  : "bg-saffron/15 text-[#b46a00]"
              }`}
            >
              {confirmed ? t.rxConfirmed : t.rxWaitingDoctor}
            </span>
          </div>

          {rx.diagnosis && (
            <p className="mt-3 text-sm text-zinc-600">
              <span className="font-semibold text-zinc-800">{t.rxAssessment}: </span>
              {rx.diagnosis}
            </p>
          )}

          {meds.length > 0 ? (
            <div className="mt-3 space-y-2">
              {meds.map((m, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between rounded-2xl bg-zinc-50 px-4 py-3"
                >
                  <div>
                    <div className="font-bold text-zinc-900">{m.name}</div>
                    <div className="text-sm text-zinc-500">
                      {[m.dosage, m.frequency, m.timing, m.duration].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span className="ml-3 shrink-0 rounded-full bg-navy/10 px-3 py-1 text-sm font-bold text-navy">
                    ×{m.quantity || 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm italic text-zinc-400">{t.rxNoMeds}</p>
          )}

          {rx.advice && (
            <p className="mt-3 rounded-2xl bg-indiagreen/8 px-4 py-3 text-sm text-zinc-700">
              {rx.advice}
            </p>
          )}

          <button
            onClick={download}
            disabled={!confirmed || saving}
            className="mt-4 w-full rounded-2xl bg-gradient-to-br from-navy to-[#2a2f7a] px-6 py-3.5 text-lg font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
          >
            {saving ? "…" : confirmed ? `⬇ ${t.rxDownload}` : t.rxWaitingDoctor}
          </button>
          {saved && <p className="mt-2 text-center text-xs text-indiagreen">{t.rxSaved}</p>}
        </div>
      )}

      {pickup && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-indiagreen/30 bg-indiagreen/10 px-5 py-2.5">
          <span className="text-xl">💊</span>
          <span className="text-left">
            <span className="block text-xs text-zinc-600">{t.pickupLabel}</span>
            <span className="block text-lg font-bold text-indiagreen">{pickup}</span>
          </span>
        </div>
      )}

      <button
        onClick={reset}
        className="mt-6 rounded-2xl bg-gradient-to-br from-saffron to-[#ff8a1f] px-10 py-3.5 text-xl font-bold text-zinc-950 shadow-lg transition hover:brightness-105"
      >
        {t.finish}
      </button>
    </div>
  );
}
