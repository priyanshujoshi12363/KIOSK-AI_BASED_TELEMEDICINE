const isOff = (value, fallback) =>
  String(value ?? fallback).toLowerCase() === "off";

const ALL_OFF = isOff(import.meta.env.VITE_AI_MODELS, "on");
const fallback = ALL_OFF ? "off" : "on";

export const STT_ENABLED = !isOff(import.meta.env.VITE_STT, fallback);
export const TTS_ENABLED = !isOff(import.meta.env.VITE_NEURAL_TTS, fallback);
export const LLM_ENABLED = !isOff(import.meta.env.VITE_LLM, fallback);
