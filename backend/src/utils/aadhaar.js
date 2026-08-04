import crypto from "crypto";

const AADHAAR_PEPPER = process.env.AADHAAR_PEPPER || "";

export function normalizeAadhaar(value) {
  return String(value || "").replace(/\D/g, "");
}

export function isValidAadhaar(value) {
  return /^\d{12}$/.test(normalizeAadhaar(value));
}

export function hashAadhaar(value) {
  const normalized = normalizeAadhaar(value);
  return crypto
    .createHash("sha256")
    .update(normalized + AADHAAR_PEPPER)
    .digest("hex");
}

export function aadhaarLast4(value) {
  return normalizeAadhaar(value).slice(-4);
}
