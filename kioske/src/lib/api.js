const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const KIOSK_KEY = import.meta.env.VITE_KIOSK_KEY || "";

export async function identifyVillager(imageBase64) {
  const res = await fetch(BASE + "/api/villager/identify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-kiosk-key": KIOSK_KEY,
    },
    body: JSON.stringify({ faceImage: imageBase64 }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ...data };
}

export async function createSession({ villagerId, symptoms, language, redFlags }) {
  const res = await fetch(BASE + "/api/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-kiosk-key": KIOSK_KEY,
    },
    body: JSON.stringify({ villagerId, symptoms, language, redFlags }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ...data };
}

export async function sendEmergency(payload) {
  const res = await fetch(BASE + "/api/emergency", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-kiosk-key": KIOSK_KEY,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, ...data };
}
