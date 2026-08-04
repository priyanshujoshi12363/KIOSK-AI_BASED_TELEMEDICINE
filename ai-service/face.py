import base64
import cv2
import numpy as np

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
