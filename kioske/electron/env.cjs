const fs = require("fs");
const path = require("path");

function loadEnv() {
  const candidates = [
    path.join(__dirname, "..", ".env"),
    path.join(process.resourcesPath || "", ".env"),
  ];

  const out = {};
  for (const file of candidates) {
    if (!file || !fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      let value = m[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(m[1] in out)) out[m[1]] = value;
    }
    break;
  }
  return out;
}

module.exports = { loadEnv };
