import { pipeline, env } from "@huggingface/transformers";
import { STT_ENABLED } from "./aiConfig.js";

env.allowRemoteModels = true;

const MODEL = import.meta.env.VITE_WHISPER_MODEL || "Xenova/whisper-base";

let asrPromise = null;

export function preloadWhisper() {
  if (!STT_ENABLED) return null;
  if (!asrPromise) {
    asrPromise = pipeline("automatic-speech-recognition", MODEL, { device: "webgpu" })
      .catch(() => pipeline("automatic-speech-recognition", MODEL));
  }
  return asrPromise;
}

export async function transcribe(float32Audio, language) {
  if (!STT_ENABLED) return "";
  const asr = await preloadWhisper();
  const out = await asr(float32Audio, {
    task: "transcribe",
    language: language || null,
    chunk_length_s: 30,
    return_timestamps: false,
  });
  return (out.text || "").trim();
}
