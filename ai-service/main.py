from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import face

app = FastAPI(title="Aarogya Kiosk AI Service", version="0.1.0")

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
