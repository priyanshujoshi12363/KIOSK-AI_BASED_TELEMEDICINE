import template from "../templates/prescription.json";
import { renderPrescription } from "./rxRenderer.js";

function formatDate(value) {
  const d = value ? new Date(value) : new Date();
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toTemplateData({ prescription, villager, doctor, session, kiosk }) {
  return {
    rxNo: String(prescription?.id || session?.id || "-").slice(-8).toUpperCase(),
    date: formatDate(prescription?.confirmedAt || prescription?.createdAt),
    kiosk: kiosk || "",
    patient: {
      name: villager?.name || "-",
      village: villager?.village || "",
      phone: villager?.phone || "",
    },
    doctor: {
      name: doctor?.name || "Tele-consultation",
      specialization: doctor?.specialization || "",
    },
    diagnosis: prescription?.diagnosis || "",
    advice: prescription?.advice || "",
    followUp: prescription?.followUp || "",
    keyPoints: prescription?.keyPoints || [],
    medicines: prescription?.medicines || [],
  };
}

export function buildRxHTML(args) {
  return renderPrescription(template, toTemplateData(args));
}

export async function savePrescriptionPDF(args) {
  const html = buildRxHTML(args);
  const safeName = String(args?.villager?.name || "patient").replace(/[^\w]+/g, "-");
  const fileName = `Aarogya-Rx-${safeName}-${Date.now()}.pdf`;

  if (typeof window !== "undefined" && window.kioskPDF) {
    return window.kioskPDF.save({ html, fileName });
  }

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url);
  if (win) {
    win.addEventListener("load", () => win.print());
  }
  return { ok: Boolean(win), fallback: true };
}
