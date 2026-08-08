import { LLM_ENABLED } from "./aiConfig.js";

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";
const MODEL = import.meta.env.VITE_OLLAMA_MODEL || "gemma3n";

const SYSTEM_PROMPT =
  "You are a health intake assistant at a rural tele-medicine kiosk in India. " +
  "Reply in the SAME language the patient uses (Hindi or English). " +
  "Ask only ONE short simple question at a time. " +
  "Gather: main problem, how long it has lasted, severity, and other symptoms. " +
  "Never diagnose or prescribe. You only collect information for the doctor. " +
  "Keep every reply under 25 words.";

const RED_FLAGS = [
  "chest pain", "can't breathe", "cannot breathe", "not breathing",
  "shortness of breath", "unconscious", "fainted", "heavy bleeding",
  "stroke", "seizure", "convulsion", "suicide",
  "सीने में दर्द", "सांस नहीं", "सांस लेने में तकलीफ", "बेहोश",
  "खून बह", "दौरा", "लकवा", "आत्महत्या",
];

export function detectRedFlags(text) {
  const t = (text || "").toLowerCase();
  return RED_FLAGS.filter((k) => t.includes(k.toLowerCase()));
}

export async function warmupOllama() {
  if (!LLM_ENABLED) return false;
  try {
    await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      body: JSON.stringify({
        model: MODEL,
        prompt: "ok",
        stream: false,
        keep_alive: "30m",
        options: { num_predict: 1 },
      }),
    });
  } catch {
    return false;
  }
  return true;
}

export async function* streamAgent(messages) {
  if (!LLM_ENABLED) return;

  const body = {
    model: MODEL,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    stream: true,
    keep_alive: "30m",
    options: { num_predict: 80, temperature: 0.4 },
  };

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const data = JSON.parse(line);
        const chunk = data.message?.content || "";
        if (chunk) yield chunk;
        if (data.done) return;
      } catch {
        continue;
      }
    }
  }
}
