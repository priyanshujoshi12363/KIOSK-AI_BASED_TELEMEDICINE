import os
import threading

from pymongo import MongoClient

_lock = threading.Lock()
_client = None
_db = None


def _uri():
    uri = os.environ.get("MONGO_URI", "").strip()
    if not uri:
        raise RuntimeError("MONGO_URI is not set")
    return uri


def get_db():
    global _client, _db
    with _lock:
        if _db is not None:
            return _db
        _client = MongoClient(
            _uri(),
            serverSelectionTimeoutMS=8000,
            connectTimeoutMS=8000,
        )
        _db = _client.get_default_database()
        if _db is None:
            _db = _client["aarogya_kiosk"]
        return _db


def ping():
    try:
        get_db().command("ping")
        return True
    except Exception:
        return False


def villagers():
    return get_db()["villagers"]
