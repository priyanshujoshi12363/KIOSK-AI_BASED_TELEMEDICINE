export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function lookup(data, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), data);
}

function fill(str, data) {
  if (typeof str !== "string") return "";
  return str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const value = lookup(data, key.trim());
    return value == null ? "" : String(value);
  });
}

function joinSub(str) {
  return str
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");
}

function styles(theme) {
  return `
  * { box-sizing: border-box; }
  body { font-family: ${theme.font}; color: ${theme.text}; margin: 0; padding: 26px 30px; font-size: ${theme.baseSize}; }
  .strip { display: flex; height: 6px; margin: -26px -30px 18px; }
  .strip i { flex: 1; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${theme.primary}; padding-bottom: 12px; }
  .brand { font-size: 21px; font-weight: 800; color: ${theme.primary}; letter-spacing: -0.3px; }
  .sub { color: ${theme.muted}; font-size: 11px; }
  .meta { text-align: right; font-size: 11px; color: ${theme.muted}; }
  .cols { display: flex; gap: 26px; margin: 16px 0 6px; }
  .cols > div { flex: 1; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: .09em; color: ${theme.faint}; margin-bottom: 3px; }
  .value { font-weight: 700; font-size: 13.5px; }
  .rx { font-size: 30px; font-weight: 800; color: ${theme.primary}; margin: 16px 0 4px; font-family: Georgia, serif; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .07em; color: ${theme.muted}; border-bottom: 1.5px solid #d7dbe3; padding: 7px 6px; }
  td { padding: 9px 6px; border-bottom: 1px solid #eceef3; vertical-align: top; }
  td.c { text-align: center; color: ${theme.muted}; }
  td.strong { font-weight: 700; color: ${theme.text}; }
  td.mono { font-family: Consolas, monospace; }
  .em { font-weight: 700; font-size: 13px; }
  td .sub { font-size: 11px; color: ${theme.muted}; margin-top: 2px; }
  .panel { border: 1px solid ${theme.line}; border-radius: 9px; padding: 11px 13px; margin-top: 12px; background: ${theme.panel}; }
  .panel h4 { margin: 0 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: .07em; color: ${theme.primary}; }
  ul { margin: 0; padding-left: 17px; }
  li { margin: 2px 0; }
  footer { margin-top: 26px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid ${theme.line}; padding-top: 12px; }
  .sign { text-align: center; }
  .signline { width: 168px; border-top: 1.5px solid ${theme.text}; margin-bottom: 4px; }
  .note { font-size: 9.5px; color: ${theme.faint}; max-width: 330px; line-height: 1.45; }
  .empty { color: ${theme.faint}; font-style: italic; padding: 14px 6px; }`;
}

function renderTable(section, data) {
  const rows = Array.isArray(lookup(data, section.source)) ? lookup(data, section.source) : [];
  if (!rows.length) {
    return `<div class="empty">${esc(section.emptyText || "")}</div>`;
  }

  const head = section.columns
    .map((c) => `<th${c.width ? ` style="width:${c.width}"` : ""}>${esc(c.header || "")}</th>`)
    .join("");

  const body = rows
    .map((row, i) => {
      const cells = section.columns
        .map((c) => {
          const classes = [];
          if (c.align === "center") classes.push("c");
          if (c.mono) classes.push("mono");
          if (c.strong) classes.push("strong");
          const cls = classes.length ? ` class="${classes.join(" ")}"` : "";

          if (c.kind === "index") return `<td${cls}>${i + 1}</td>`;

          const raw = row[c.field];
          const value = raw === undefined || raw === null || raw === "" ? c.fallback || "" : raw;
          const subValue = c.sub ? row[c.sub] : "";

          if (c.emphasis) {
            return `<td${cls}><div class="em">${esc(value)}</div>${
              subValue ? `<div class="sub">${esc(subValue)}</div>` : ""
            }</td>`;
          }
          return `<td${cls}>${esc(value)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderSection(section, data) {
  if (section.type === "columns") {
    const cols = section.columns
      .map((c) => {
        const sub = joinSub(fill(c.sub || "", data));
        return `<div>
          <div class="label">${esc(c.label || "")}</div>
          <div class="value">${esc(fill(c.value, data) || "-")}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>`;
      })
      .join("");
    return `<div class="cols">${cols}</div>`;
  }

  if (section.type === "panel") {
    const value = fill(section.value, data).trim();
    if (!value && section.hideIfEmpty) return "";
    return `<div class="panel"><h4>${esc(section.title || "")}</h4>${esc(value)}</div>`;
  }

  if (section.type === "list") {
    const items = lookup(data, section.source);
    if ((!Array.isArray(items) || !items.length) && section.hideIfEmpty) return "";
    const lis = (items || []).map((i) => `<li>${esc(i)}</li>`).join("");
    return `<div class="panel"><h4>${esc(section.title || "")}</h4><ul>${lis}</ul></div>`;
  }

  if (section.type === "rxSymbol") {
    return `<div class="rx">&#8478;</div>`;
  }

  if (section.type === "table") {
    return renderTable(section, data);
  }

  return "";
}

export function renderPrescription(template, data) {
  const theme = template.theme || {};

  const strip = template.header?.tricolorStrip
    ? `<div class="strip"><i style="background:${theme.saffron}"></i><i style="background:#fff"></i><i style="background:${theme.green}"></i></div>`
    : "";

  const meta = (template.header?.meta || [])
    .map((m) => {
      const value = fill(m.value, data).trim();
      if (!value && m.hideIfEmpty) return "";
      return `<div>${m.label ? `<strong>${esc(m.label)}</strong> ` : ""}${esc(value)}</div>`;
    })
    .join("");

  const body = (template.sections || [])
    .map((s) => renderSection(s, data))
    .filter(Boolean)
    .join("\n");

  const signName = fill(template.footer?.signature?.name, data).trim() ||
    template.footer?.signature?.fallbackName || "";

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>${styles(theme)}</style></head>
<body>
  ${strip}
  <header>
    <div>
      <div class="brand">${esc(template.header?.title || "")}</div>
      <div class="sub">${esc(template.header?.subtitle || "")}</div>
    </div>
    <div class="meta">${meta}</div>
  </header>
  ${body}
  <footer>
    <div class="note">${esc(template.footer?.note || "")}</div>
    <div class="sign">
      <div class="signline"></div>
      <div class="value">${esc(signName)}</div>
      <div class="sub">${esc(template.footer?.signature?.caption || "")}</div>
    </div>
  </footer>
</body></html>`;
}
