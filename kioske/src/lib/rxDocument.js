function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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

export function buildRxHTML({ prescription, villager, doctor, session, kiosk }) {
  const meds = prescription?.medicines || [];

  const rows = meds
    .map(
      (m, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>
          <div class="med">${esc(m.name)}</div>
          ${m.instructions ? `<div class="sub">${esc(m.instructions)}</div>` : ""}
        </td>
        <td>${esc(m.dosage || "-")}</td>
        <td class="mono">${esc(m.frequency || "-")}</td>
        <td>${esc(m.timing || "-")}</td>
        <td>${esc(m.duration || "-")}</td>
        <td class="qty">${esc(m.quantity || 1)}</td>
      </tr>`
    )
    .join("");

  const points = (prescription?.keyPoints || [])
    .map((k) => `<li>${esc(k)}</li>`)
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #16181f; margin: 0; padding: 26px 30px; font-size: 12.5px; }
  .strip { display: flex; height: 6px; margin: -26px -30px 18px; }
  .strip i { flex: 1; } .s { background: #ff9933; } .w { background: #fff; } .g { background: #138808; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #01055b; padding-bottom: 12px; }
  .brand { font-size: 21px; font-weight: 800; color: #01055b; letter-spacing: -0.3px; }
  .sub { color: #6b7280; font-size: 11px; }
  .rxid { text-align: right; font-size: 11px; color: #6b7280; }
  .grid { display: flex; gap: 26px; margin: 16px 0 6px; }
  .grid > div { flex: 1; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: .09em; color: #9aa1ad; margin-bottom: 3px; }
  .value { font-weight: 700; font-size: 13.5px; }
  .rx { font-size: 30px; font-weight: 800; color: #01055b; margin: 16px 0 4px; font-family: Georgia, serif; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .07em; color: #6b7280; border-bottom: 1.5px solid #d7dbe3; padding: 7px 6px; }
  td { padding: 9px 6px; border-bottom: 1px solid #eceef3; vertical-align: top; }
  td.num, td.qty { width: 34px; text-align: center; color: #6b7280; }
  td.qty { font-weight: 700; color: #16181f; }
  .med { font-weight: 700; font-size: 13px; }
  td .sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .mono { font-family: "Consolas", monospace; }
  .box { border: 1px solid #e3e6ec; border-radius: 9px; padding: 11px 13px; margin-top: 12px; background: #fbfcfe; }
  .box h4 { margin: 0 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: .07em; color: #01055b; }
  ul { margin: 0; padding-left: 17px; }
  li { margin: 2px 0; }
  footer { margin-top: 26px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e3e6ec; padding-top: 12px; }
  .sign { text-align: center; }
  .signline { width: 168px; border-top: 1.5px solid #16181f; margin-bottom: 4px; }
  .note { font-size: 9.5px; color: #9aa1ad; max-width: 330px; line-height: 1.45; }
  .empty { color: #9aa1ad; font-style: italic; padding: 14px 6px; }
</style></head>
<body>
  <div class="strip"><i class="s"></i><i class="w"></i><i class="g"></i></div>

  <header>
    <div>
      <div class="brand">Aarogya Kiosk</div>
      <div class="sub">AI-Assisted Tele-medicine · Government of Kerala</div>
    </div>
    <div class="rxid">
      <div><strong>Rx No.</strong> ${esc(String(prescription?.id || session?.id || "-").slice(-8).toUpperCase())}</div>
      <div>${esc(formatDate(prescription?.confirmedAt || prescription?.createdAt))}</div>
      ${kiosk ? `<div>${esc(kiosk)}</div>` : ""}
    </div>
  </header>

  <div class="grid">
    <div>
      <div class="label">Patient</div>
      <div class="value">${esc(villager?.name || "-")}</div>
      <div class="sub">${esc([villager?.village, villager?.phone].filter(Boolean).join(" · "))}</div>
    </div>
    <div>
      <div class="label">Consulting Doctor</div>
      <div class="value">${esc(doctor?.name || "Tele-consultation")}</div>
      <div class="sub">${esc(doctor?.specialization || "")}</div>
    </div>
  </div>

  ${prescription?.diagnosis ? `<div class="box"><h4>Assessment</h4>${esc(prescription.diagnosis)}</div>` : ""}

  <div class="rx">&#8478;</div>
  ${
    meds.length
      ? `<table>
    <thead><tr><th></th><th>Medicine</th><th>Dose</th><th>Frequency</th><th>When</th><th>Duration</th><th>Qty</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
      : `<div class="empty">No medicines were prescribed in this consultation.</div>`
  }

  ${prescription?.advice ? `<div class="box"><h4>Advice</h4>${esc(prescription.advice)}</div>` : ""}
  ${points ? `<div class="box"><h4>Doctor's Notes</h4><ul>${points}</ul></div>` : ""}
  ${prescription?.followUp ? `<div class="box"><h4>Follow-up</h4>${esc(prescription.followUp)}</div>` : ""}

  <footer>
    <div class="note">
      Generated from an AI-assisted tele-consultation and confirmed by the attending doctor.
      Medicines are delivered by your ASHA worker. Not valid for medico-legal purposes.
    </div>
    <div class="sign">
      <div class="signline"></div>
      <div class="value">${esc(doctor?.name || "Attending Doctor")}</div>
      <div class="sub">Digitally confirmed</div>
    </div>
  </footer>
</body></html>`;
}

export async function savePrescriptionPDF(args) {
  const html = buildRxHTML(args);
  const fileName = `Aarogya-Rx-${String(args?.villager?.name || "patient").replace(/\s+/g, "-")}-${Date.now()}.pdf`;

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
