import base64
import io
import os
import threading

import numpy as np

KOKORO_REPO = os.environ.get("KOKORO_REPO", "hexgrad/Kokoro-82M")
SAMPLE_RATE = 24000

VOICE = {
    "hi": "hf_alpha",
    "gu": "hf_alpha",
    "en": "af_heart",
    "ml": "hf_alpha",
}

_lock = threading.Lock()
_pipeline = None
_backend = None


def _load_kokoro():
    global _pipeline, _backend
    with _lock:
        if _pipeline is not None:
            return _pipeline, _backend

        try:
            from kokoro import KPipeline

            _pipeline = KPipeline(lang_code="h", repo_id=KOKORO_REPO)
            _backend = "kokoro"
            return _pipeline, _backend
        except Exception:
            _pipeline = None
            _backend = None
            raise


def available():
    try:
        import kokoro  # noqa: F401

        return True
    except Exception:
        return False


def _to_wav_base64(samples, sample_rate):
    import soundfile as sf

    buf = io.BytesIO()
    sf.write(buf, np.asarray(samples, dtype="float32"), sample_rate, format="WAV")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def _pyttsx3(text):
    import tempfile

    import pyttsx3

    path = os.path.join(tempfile.gettempdir(), "aarogya_tts.wav")
    engine = pyttsx3.init()
    engine.save_to_file(text, path)
    engine.runAndWait()

    with open(path, "rb") as fh:
        data = fh.read()
    try:
        os.remove(path)
    except OSError:
        pass
    return base64.b64encode(data).decode("ascii")


def synthesize(text, language="hi"):
    text = (text or "").strip()
    if not text:
        raise ValueError("empty_text")

    voice = VOICE.get(language, "hf_alpha")

    try:
        pipeline, _ = _load_kokoro()
        chunks = []
        for _, _, audio in pipeline(text, voice=voice):
            chunks.append(np.asarray(audio, dtype="float32"))
        if chunks:
            merged = np.concatenate(chunks)
            return {"audio": _to_wav_base64(merged, SAMPLE_RATE), "engine": "kokoro"}
    except Exception:
        pass

    return {"audio": _pyttsx3(text), "engine": "pyttsx3"}
