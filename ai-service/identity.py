import json
import os
import threading
import time

import numpy as np

import db
import face

THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", "0.30"))
CACHE_PATH = os.environ.get("FACE_CACHE_PATH", os.path.join(os.path.dirname(__file__), ".face_cache.json"))
CACHE_TTL = int(os.environ.get("FACE_CACHE_TTL", "300"))

_lock = threading.Lock()
_matrix = None
_owners = []
_people = {}
_loaded_at = 0
_source = "empty"


def _public(doc):
    return {
        "id": str(doc.get("_id")),
        "name": doc.get("name"),
        "gender": doc.get("gender"),
        "phone": doc.get("phone"),
        "village": doc.get("village"),
        "address": doc.get("address"),
        "aadhaarLast4": doc.get("aadhaarLast4"),
        "abhaId": doc.get("abhaId"),
        "assignedAshaWorker": str(doc["assignedAshaWorker"])
        if doc.get("assignedAshaWorker")
        else None,
    }


def _vectors_of(doc):
    vectors = []
    many = doc.get("faceEmbeddings")
    if isinstance(many, list):
        for vec in many:
            if isinstance(vec, list) and vec:
                vectors.append(vec)
    single = doc.get("faceEmbedding")
    if isinstance(single, list) and single:
        vectors.append(single)
    return vectors


def _build(entries):
    rows = []
    owners = []
    people = {}

    for person, vectors in entries:
        pid = person["id"]
        people[pid] = person
        for vec in vectors:
            arr = np.asarray(vec, dtype="float32")
            norm = np.linalg.norm(arr)
            if norm > 0:
                arr = arr / norm
            rows.append(arr)
            owners.append(pid)

    matrix = np.vstack(rows).astype("float32") if rows else None
    return matrix, owners, people


def _save_cache(entries):
    try:
        payload = [{"person": p, "vectors": [list(map(float, v)) for v in vs]} for p, vs in entries]
        with open(CACHE_PATH, "w", encoding="utf-8") as fh:
            json.dump({"saved_at": time.time(), "entries": payload}, fh)
    except Exception:
        pass


def _load_cache():
    try:
        with open(CACHE_PATH, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return [(item["person"], item["vectors"]) for item in data.get("entries", [])]
    except Exception:
        return []


def refresh(force=False):
    global _matrix, _owners, _people, _loaded_at, _source

    with _lock:
        if not force and _matrix is not None and time.time() - _loaded_at < CACHE_TTL:
            return {"people": len(_people), "vectors": len(_owners), "source": _source}

        entries = []
        source = "db"
        try:
            cursor = db.villagers().find(
                {"isActive": True, "faceRegistered": True},
                {
                    "name": 1, "gender": 1, "phone": 1, "village": 1, "address": 1,
                    "aadhaarLast4": 1, "abhaId": 1, "assignedAshaWorker": 1,
                    "faceEmbeddings": 1, "faceEmbedding": 1,
                },
            )
            for doc in cursor:
                vectors = _vectors_of(doc)
                if vectors:
                    entries.append((_public(doc), vectors))
            _save_cache(entries)
        except Exception:
            entries = _load_cache()
            source = "cache"

        _matrix, _owners, _people = _build(entries)
        _loaded_at = time.time()
        _source = source if entries else "empty"

        return {"people": len(_people), "vectors": len(_owners), "source": _source}


def status():
    return {
        "people": len(_people),
        "vectors": len(_owners),
        "source": _source,
        "threshold": THRESHOLD,
        "age_seconds": int(time.time() - _loaded_at) if _loaded_at else None,
    }


def identify(image_b64):
    refresh()

    probe = face.embed_best(image_b64)
    if not probe["embedding"]:
        return {"identified": False, "reason": "no_face", "faces": probe["faces"]}

    if _matrix is None or not len(_owners):
        return {"identified": False, "reason": "no_enrolled_faces"}

    vec = np.asarray(probe["embedding"], dtype="float32")
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    scores = _matrix @ vec
    best = int(np.argmax(scores))
    score = float(scores[best])

    if score < THRESHOLD:
        return {"identified": False, "reason": "no_match", "score": score}

    return {
        "identified": True,
        "score": score,
        "villager": _people[_owners[best]],
        "source": _source,
    }


def enroll(villager_id, images):
    from bson import ObjectId

    vectors = []
    for image in images:
        result = face.embed_best(image)
        if not result["embedding"]:
            raise ValueError("no_face")
        vectors.append([float(x) for x in result["embedding"]])

    db.villagers().update_one(
        {"_id": ObjectId(villager_id)},
        {"$set": {"faceEmbeddings": vectors, "faceRegistered": True}},
    )
    refresh(force=True)
    return {"villager": villager_id, "vectors": len(vectors)}
