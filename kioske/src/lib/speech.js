import { KokoroTTS } from "kokoro-js";
import { TTS_ENABLED } from "./aiConfig.js";

const VOICES = { hi: "hf_alpha", en: "af_heart" };

let ttsPromise = null;
let audioCtx = null;

function langFromLocale(locale) {
  const p = (locale || "hi").slice(0, 2);
  return VOICES[p] ? p : "hi";
}

function getTTS() {
  if (!TTS_ENABLED) {
    return Promise.reject(new Error("neural_tts_disabled"));
  }
  if (!ttsPromise) {
    ttsPromise = KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
      dtype: "q8",
      device: "wasm",
    });
  }
  return ttsPromise;
}

export function preloadTTS() {
  if (!TTS_ENABLED) return;
  getTTS();
}

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playPCM(float32, sampleRate) {
  return new Promise((resolve) => {
    try {
      const ctx = getCtx();
      const data = float32 instanceof Float32Array ? float32 : Float32Array.from(float32);
      const buffer = ctx.createBuffer(1, data.length, sampleRate);
      buffer.copyToChannel(data, 0);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.onended = () => resolve();
      src.start();
    } catch {
      resolve();
    }
  });
}

function fallbackSpeak(text, locale) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale || "hi-IN";
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
    setTimeout(resolve, 9000);
  });
}

export async function speak(text, locale) {
  if (!text) return;
  const lang = langFromLocale(locale);
  try {
    const tts = await getTTS();
    const out = await tts.generate(text, { voice: VOICES[lang] });
    await playPCM(out.audio, out.sampling_rate);
  } catch {
    await fallbackSpeak(text, locale);
  }
}
