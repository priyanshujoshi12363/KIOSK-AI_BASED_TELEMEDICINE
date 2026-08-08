import os

os.environ.setdefault("HF_HOME", r"E:\hf-cache")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

import db
import face
import identity
import tts as tts_engine
import voice

app = FastAPI(title="Aarogya Kiosk AI Service", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    service: str


class EmbedRequest(BaseModel):
    image: str


class EmbedResponse(BaseModel):
    faces: int
    embedding: list[float]


class EmbedBestResponse(BaseModel):
    faces: int
    embedding: list[float] | None


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", service="ai-service")


@app.get("/")
def root():
    return {"message": "Aarogya Kiosk AI Service"}


@app.post("/face/embed", response_model=EmbedResponse)
def face_embed(req: EmbedRequest):
    try:
        embeddings = face.embed(req.image)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid_image")
    except Exception:
        raise HTTPException(status_code=500, detail="embedding_failed")

    if len(embeddings) == 0:
        raise HTTPException(status_code=400, detail="no_face_detected")
    if len(embeddings) > 1:
        raise HTTPException(status_code=400, detail="multiple_faces_detected")

    return EmbedResponse(faces=1, embedding=embeddings[0])


@app.post("/face/embed-best", response_model=EmbedBestResponse)
def face_embed_best(req: EmbedRequest):
    try:
        result = face.embed_best(req.image)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid_image")
    except Exception:
        raise HTTPException(status_code=500, detail="embedding_failed")
    return EmbedBestResponse(faces=result["faces"], embedding=result["embedding"])


class IdentifyRequest(BaseModel):
    image: str


class EnrollRequest(BaseModel):
    villagerId: str
    images: list[str]


@app.get("/identity/status")
def identity_status():
    return {"db": db.ping(), **identity.status()}


@app.post("/identity/refresh")
def identity_refresh():
    return identity.refresh(force=True)


@app.post("/identity/identify")
def identity_identify(req: IdentifyRequest):
    try:
        return identity.identify(req.image)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid_image")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"identify_failed: {exc}")


@app.post("/identity/enroll")
def identity_enroll(req: EnrollRequest):
    if not req.images:
        raise HTTPException(status_code=400, detail="images_required")
    try:
        return identity.enroll(req.villagerId, req.images)
    except ValueError:
        raise HTTPException(status_code=400, detail="no_face")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"enroll_failed: {exc}")


class Turn(BaseModel):
    role: str
    content: str


class ConsultRequest(BaseModel):
    audio: str
    language: str | None = None
    history: list[Turn] = []


class ConsultResponse(BaseModel):
    transcript: str
    reply: str


class TranscribeRequest(BaseModel):
    audio: str
    language: str | None = None


class TranscribeResponse(BaseModel):
    text: str


class TTSRequest(BaseModel):
    text: str
    language: str = "hi"


class TTSResponse(BaseModel):
    audio: str
    mime: str = "audio/wav"
    engine: str


@app.get("/voice/status")
def voice_status():
    return {
        "model": voice.MODEL_ID,
        "loaded": voice.is_loaded(),
        "device": "cuda" if voice.torch.cuda.is_available() else "cpu",
        "kokoro": tts_engine.available(),
    }


@app.post("/voice/transcribe", response_model=TranscribeResponse)
def voice_transcribe(req: TranscribeRequest):
    try:
        return TranscribeResponse(text=voice.transcribe(req.audio, req.language))
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid_audio")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"transcribe_failed: {exc}")


@app.post("/voice/consult", response_model=ConsultResponse)
def voice_consult(req: ConsultRequest):
    try:
        history = [turn.model_dump() for turn in req.history]
        result = voice.consult(req.audio, req.language, history)
        return ConsultResponse(**result)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid_audio")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"consult_failed: {exc}")


class ChatRequest(BaseModel):
    messages: list[Turn] = []
    system: str | None = None


class ChatResponse(BaseModel):
    reply: str


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        messages = [turn.model_dump() for turn in req.messages]
        return ChatResponse(reply=voice.chat(messages, req.system))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"chat_failed: {exc}")


@app.post("/tts", response_model=TTSResponse)
def synthesize(req: TTSRequest):
    try:
        result = tts_engine.synthesize(req.text, req.language)
        return TTSResponse(audio=result["audio"], engine=result["engine"])
    except ValueError:
        raise HTTPException(status_code=400, detail="empty_text")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"tts_failed: {exc}")
