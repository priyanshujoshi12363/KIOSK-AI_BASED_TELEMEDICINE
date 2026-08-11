const { loadEnv } = require("./env.cjs");

const env = loadEnv();

const SARVAM_KEY = env.SARVAM_AI_API_KEY || process.env.SARVAM_AI_API_KEY || "";
const OLLAMA_KEY = env.OLLAMA_CLOUD_API || process.env.OLLAMA_CLOUD_API || "";
const CLOUD_MODEL = env.OLLAMA_CLOUD_MODEL || "gemma4:31b";
const STT_MODEL = env.SARVAM_STT_MODEL || "saarika:v2.5";
const SPEAKER = env.SARVAM_SPEAKER || "anushka";

const SARVAM_STT = "https://api.sarvam.ai/speech-to-text";
const SARVAM_TTS = "https://api.sarvam.ai/text-to-speech";
const OLLAMA_CHAT = "https://ollama.com/api/chat";

const LOCALE = { hi: "hi-IN", en: "en-IN", gu: "gu-IN", ml: "ml-IN" };

function locale(lang) {
  return LOCALE[lang] || "hi-IN";
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

function configured() {
  return { sarvam: Boolean(SARVAM_KEY), ollama: Boolean(OLLAMA_KEY), model: CLOUD_MODEL };
}

async function reachable(timeoutMs = 8000) {
  const t = withTimeout(timeoutMs);
  try {
    const res = await fetch("https://ollama.com/api/tags", {
      headers: { Authorization: `Bearer ${OLLAMA_KEY}` },
      signal: t.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    t.done();
  }
}

async function transcribe({ audioBase64, language }) {
  if (!SARVAM_KEY) throw new Error("sarvam_key_missing");

  const bytes = Buffer.from(audioBase64, "base64");
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "audio/wav" }), "audio.wav");
  form.append("model", STT_MODEL);
  form.append("language_code", locale(language));

  const t = withTimeout(30000);
  try {
    const res = await fetch(SARVAM_STT, {
      method: "POST",
      headers: { "api-subscription-key": SARVAM_KEY },
      body: form,
      signal: t.signal,
    });
    if (!res.ok) throw new Error(`sarvam_stt_${res.status}`);
    const data = await res.json();
    return {
      text: (data.transcript || "").trim(),
      language: data.language_code || locale(language),
    };
  } finally {
    t.done();
  }
}

async function chat({ messages, system }) {
  if (!OLLAMA_KEY) throw new Error("ollama_key_missing");

  const payload = {
    model: CLOUD_MODEL,
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    stream: false,
  };

  const t = withTimeout(45000);
  try {
    const res = await fetch(OLLAMA_CHAT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OLLAMA_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: t.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`ollama_${res.status}:${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    return { text: (data.message?.content || "").trim() };
  } finally {
    t.done();
  }
}

async function speak({ text, language }) {
  if (!SARVAM_KEY) throw new Error("sarvam_key_missing");

  const t = withTimeout(30000);
  try {
    const res = await fetch(SARVAM_TTS, {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        target_language_code: locale(language),
        speaker: SPEAKER,
      }),
      signal: t.signal,
    });
    if (!res.ok) throw new Error(`sarvam_tts_${res.status}`);
    const data = await res.json();
    const audio = Array.isArray(data.audios) ? data.audios[0] : null;
    if (!audio) throw new Error("sarvam_tts_empty");
    return { audioBase64: audio, mime: "audio/wav" };
  } finally {
    t.done();
  }
}

module.exports = { configured, reachable, transcribe, chat, speak };
