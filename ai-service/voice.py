import base64
import io
import os
import threading

import numpy as np
import torch

MODEL_ID = os.environ.get(
    "GEMMA_REPO", "google/gemma-4-E2B-it-qat-mobile-transformers"
)
SAMPLE_RATE = 16000

SYSTEM_PROMPT = (
    "You are a health intake assistant at a rural tele-medicine kiosk in India. "
    "Reply in the SAME language the patient speaks (Hindi, Gujarati or English). "
    "Ask only ONE short simple question at a time. "
    "Gather: main problem, how long it has lasted, severity, and other symptoms. "
    "Never diagnose or prescribe. You only collect information for the doctor. "
    "Keep every reply under 25 words."
)

_lock = threading.Lock()
_model = None
_processor = None


def _device():
    return "cuda" if torch.cuda.is_available() else "cpu"


def _dtype():
    if not torch.cuda.is_available():
        return torch.float32
    major, _ = torch.cuda.get_device_capability()
    return torch.bfloat16 if major >= 8 else torch.float16


def load():
    global _model, _processor
    with _lock:
        if _model is not None:
            return _model, _processor

        from transformers import AutoModelForMultimodalLM, AutoProcessor

        processor = AutoProcessor.from_pretrained(MODEL_ID)
        model = AutoModelForMultimodalLM.from_pretrained(
            MODEL_ID,
            dtype=_dtype(),
            device_map=_device(),
            low_cpu_mem_usage=True,
        )
        model.eval()

        _model, _processor = model, processor
        return _model, _processor


def is_loaded():
    return _model is not None


def decode_audio(audio_b64):
    if "," in audio_b64:
        audio_b64 = audio_b64.split(",", 1)[1]
    raw = base64.b64decode(audio_b64)

    import soundfile as sf

    data, sr = sf.read(io.BytesIO(raw), dtype="float32", always_2d=False)
    if data.ndim > 1:
        data = data.mean(axis=1)

    if sr != SAMPLE_RATE:
        import torchaudio.functional as AF

        tensor = torch.from_numpy(np.ascontiguousarray(data)).unsqueeze(0)
        data = AF.resample(tensor, sr, SAMPLE_RATE).squeeze(0).numpy()

    return data.astype("float32")


def _build_messages(history, audio, instruction):
    messages = [{"role": "system", "content": [{"type": "text", "text": SYSTEM_PROMPT}]}]

    for turn in history or []:
        role = turn.get("role")
        text = (turn.get("content") or "").strip()
        if role in ("user", "assistant") and text:
            messages.append({"role": role, "content": [{"type": "text", "text": text}]})

    content = [{"type": "audio", "audio": audio}]
    if instruction:
        content.append({"type": "text", "text": instruction})
    messages.append({"role": "user", "content": content})
    return messages


@torch.inference_mode()
def _generate(messages, max_new_tokens):
    model, processor = load()

    inputs = processor.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
    ).to(model.device)

    prompt_len = inputs["input_ids"].shape[-1]
    out = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        do_sample=False,
    )
    return processor.decode(out[0][prompt_len:], skip_special_tokens=True).strip()


def transcribe(audio_b64, language=None):
    audio = decode_audio(audio_b64)
    hint = {
        "hi": "Hindi",
        "gu": "Gujarati",
        "en": "English",
        "ml": "Malayalam",
    }.get(language)

    instruction = "Transcribe this audio exactly. Reply with the transcription only."
    if hint:
        instruction = (
            f"Transcribe this {hint} audio exactly. Reply with the transcription only."
        )

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "audio", "audio": audio},
                {"type": "text", "text": instruction},
            ],
        }
    ]
    return _generate(messages, max_new_tokens=128)


CONSULT_INSTRUCTION = (
    "The patient just spoke. Respond in exactly this format and nothing else:\n"
    "HEARD: <what the patient said, in their own language>\n"
    "REPLY: <your next single short question, same language, under 25 words>"
)


def _parse_consult(raw):
    heard, reply = "", ""
    for line in (raw or "").splitlines():
        stripped = line.strip()
        upper = stripped.upper()
        if upper.startswith("HEARD:"):
            heard = stripped[6:].strip()
        elif upper.startswith("REPLY:"):
            reply = stripped[6:].strip()
    if not reply:
        reply = (raw or "").strip()
    return heard, reply


def consult(audio_b64, language=None, history=None):
    audio = decode_audio(audio_b64)
    messages = _build_messages(history, audio, CONSULT_INSTRUCTION)
    raw = _generate(messages, max_new_tokens=128)
    transcript, reply = _parse_consult(raw)
    return {"transcript": transcript, "reply": reply}
