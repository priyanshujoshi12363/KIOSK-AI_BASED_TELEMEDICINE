import base64
import os

import cv2
import numpy as np

if os.environ.get("INSIGHTFACE_HOME"):
    os.environ.setdefault("INSIGHTFACE_HOME", os.environ["INSIGHTFACE_HOME"])

_face_app = None


def _get_app():
    global _face_app
    if _face_app is None:
        from insightface.app import FaceAnalysis

        app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        app.prepare(ctx_id=-1, det_size=(640, 640))
        _face_app = app
    return _face_app


def _decode(image_b64):
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]
    raw = base64.b64decode(image_b64)
    arr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("invalid_image")
    return img


def embed(image_b64):
    img = _decode(image_b64)
    faces = _get_app().get(img)
    return [f.normed_embedding.tolist() for f in faces]


def embed_best(image_b64):
    img = _decode(image_b64)
    faces = _get_app().get(img)
    if not faces:
        return {"faces": 0, "embedding": None}
    faces.sort(
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
        reverse=True,
    )
    return {"faces": len(faces), "embedding": faces[0].normed_embedding.tolist()}
