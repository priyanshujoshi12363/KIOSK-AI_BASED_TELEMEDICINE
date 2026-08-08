const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const AI_SERVICE = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";
const KIOSK_KEY = import.meta.env.VITE_KIOSK_KEY || "";

async function identifyViaBackend(imageBase64) {
  const res = await fetch(BASE + "/api/villager/identify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-kiosk-key": KIOSK_KEY,
    },
    body: JSON.stringify({ faceImage: imageBase64 }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, via: "backend", ...data };
}

export async function identifyVillager(imageBase64) {
  try {
    const res = await fetch(AI_SERVICE + "/identity/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    });
    if (res.ok) {
      const data = await res.json();
      return { status: res.status, via: "ai-service", ...data };
    }
  } catch {
    // ai-service unreachable, fall back to the backend
  }

  return identifyViaBackend(imageBase64);
}

export async function enrollFace(villagerId, images) {
  const res = await fetch(AI_SERVICE + "/identity/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ villagerId, images }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, ...data };
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
