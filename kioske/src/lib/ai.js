import { wavToBase64, base64ToBlobUrl } from "./wav.js";
import { transcribe as whisperTranscribe } from "./whisper.js";
import { streamAgent } from "./ollama.js";
import { speak as localSpeak } from "./speech.js";
import { STT_ENABLED, LLM_ENABLED } from "./aiConfig.js";

const AI_SERVICE = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000";
const ONLINE_RECHECK_MS = 20000;

const bridge = typeof window !== "undefined" ? window.cloudAI : null;

let onlineState = { checked: 0, value: false };

export function hasCloudBridge() {
  return Boolean(bridge);
}

export async function isOnline({ force = false } = {}) {
  if (!bridge) return false;
  const now = Date.now();
  if (!force && now - onlineState.checked < ONLINE_RECHECK_MS) {
    return onlineState.value;
  }
  let value = false;
  try {
    const res = await bridge.reachable();
    value = Boolean(res?.reachable);
  } catch {
    value = false;
  }
  onlineState = { checked: now, value };
  return value;
}

async function offlineConsult({ audioBase64, language, history }) {
  const res = await fetch(`${AI_SERVICE}/voice/consult`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: audioBase64, language, history: history || [] }),
  });
  if (!res.ok) throw new Error(`ai_service_${res.status}`);
  return res.json();
}

async function offlineTranscribe({ audioBase64, language }) {
  const res = await fetch(`${AI_SERVICE}/voice/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: audioBase64, language }),
  });
  if (!res.ok) throw new Error(`ai_service_${res.status}`);
  return res.json();
}

async function offlineTTS({ text, language }) {
  const res = await fetch(`${AI_SERVICE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error(`ai_service_${res.status}`);
  return res.json();
}

async function localLLM(messages) {
  let acc = "";
  for await (const chunk of streamAgent(messages)) acc += chunk;
  return acc.trim();
}

export async function transcribeAudio(float32Audio, language) {
  const audioBase64 = wavToBase64(float32Audio, 16000);

  if (await isOnline()) {
    try {
      const res = await bridge.transcribe({ audioBase64, language });
      if (res?.ok && res.text) return { text: res.text, mode: "cloud" };
    } catch {
      // fall through to offline
    }
  }

  try {
    const res = await offlineTranscribe({ audioBase64, language });
    if (res?.text) return { text: res.text, mode: "local" };
  } catch {
    // fall through to in-browser whisper
  }

  if (STT_ENABLED) {
    const text = await whisperTranscribe(float32Audio, language);
    if (text) return { text, mode: "browser" };
  }

  return { text: "", mode: "none" };
}

export async function askAgent({ float32Audio, text, language, history = [], system }) {
  const online = await isOnline();

  if (float32Audio && !online) {
    const audioBase64 = wavToBase64(float32Audio, 16000);
    try {
      const res = await offlineConsult({ audioBase64, language, history });
      if (res?.reply) {
        return {
          transcript: res.transcript || "",
          reply: res.reply,
          mode: "local-audio",
        };
      }
    } catch {
      // fall through
    }
  }

  let transcript = text || "";
  if (!transcript && float32Audio) {
    const t = await transcribeAudio(float32Audio, language);
    transcript = t.text;
  }
  if (!transcript) return { transcript: "", reply: "", mode: "none" };

  const messages = [...history, { role: "user", content: transcript }];

  if (online) {
    try {
      const res = await bridge.chat({ messages, system });
      if (res?.ok && res.text) return { transcript, reply: res.text, mode: "cloud" };
    } catch {
      // fall through
    }
  }

  if (LLM_ENABLED) {
    try {
      const reply = await localLLM(system ? [{ role: "system", content: system }, ...messages] : messages);
      if (reply) return { transcript, reply, mode: "local" };
    } catch {
      // fall through
    }
  }

  return { transcript, reply: "", mode: "none" };
}

function playBase64(audioBase64, mime) {
  return new Promise((resolve) => {
    try {
      const url = base64ToBlobUrl(audioBase64, mime || "audio/wav");
      const audio = new Audio(url);
      const done = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onended = done;
      audio.onerror = done;
      audio.play().catch(done);
    } catch {
      resolve();
    }
  });
}

export async function speakText(text, language, locale) {
  if (!text) return "none";

  if (await isOnline()) {
    try {
      const res = await bridge.speak({ text, language });
      if (res?.ok && res.audioBase64) {
        await playBase64(res.audioBase64, res.mime);
        return "cloud";
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await offlineTTS({ text, language });
    if (res?.audio) {
      await playBase64(res.audio, res.mime || "audio/wav");
      return "local";
    }
  } catch {
    // fall through
  }

  await localSpeak(text, locale);
  return "browser";
}
