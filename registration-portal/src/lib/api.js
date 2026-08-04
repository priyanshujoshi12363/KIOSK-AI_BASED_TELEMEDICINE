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
