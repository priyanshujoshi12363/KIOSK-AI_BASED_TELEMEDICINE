const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || "Request failed");
  }
  return data;
}

export function apiPost(path, body, token) {
  return request("POST", path, body, token);
}

export function apiGet(path, token) {
  return request("GET", path, null, token);
}

export const API_BASE = BASE;

const AI_SERVICE = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";

export const AI_SERVICE_BASE = AI_SERVICE;

export async function aiServiceReachable() {
  try {
    const res = await fetch(AI_SERVICE + "/health", { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function enrollFace(villagerId, images) {
  const res = await fetch(AI_SERVICE + "/identity/enroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ villagerId, images }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Face enrolment failed");
  }
  return data;
}
