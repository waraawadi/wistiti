from __future__ import annotations

from io import BytesIO
from typing import Iterable

from PIL import Image, ImageOps

try:
    import numpy as np
except Exception:  # pragma: no cover - dépendance optionnelle à l'exécution
    np = None

try:
    import cv2
except Exception:  # pragma: no cover - dépendance optionnelle à l'exécution
    cv2 = None


EMBEDDING_DIM = 128


def _to_bgr_array(file_bytes: bytes) -> np.ndarray | None:
    if np is None:
        return None
    if cv2 is not None:
        arr = np.frombuffer(file_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is not None:
            return img
    try:
        pil = Image.open(BytesIO(file_bytes))
        pil = ImageOps.exif_transpose(pil).convert("RGB")
        rgb = np.array(pil)
        return rgb[:, :, ::-1].copy()  # RGB -> BGR
    except Exception:
        return None


def _detect_face(gray: np.ndarray) -> tuple[int, int, int, int] | None:
    if cv2 is None:
        return None
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    if cascade.empty():
        return None
    faces = cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(72, 72),
    )
    if len(faces) == 0:
        return None
    # Plus grand visage
    x, y, w, h = max(faces, key=lambda f: int(f[2]) * int(f[3]))
    return int(x), int(y), int(w), int(h)


def _embedding_from_face(face_gray: np.ndarray) -> list[float]:
    if np is None:
        return [0.0] * EMBEDDING_DIM
    if cv2 is not None:
        face_gray = cv2.resize(face_gray, (112, 112), interpolation=cv2.INTER_AREA)
        face_gray = cv2.equalizeHist(face_gray)
    else:
        pil = Image.fromarray(face_gray).resize((112, 112))
        face_gray = np.array(pil)

    face = face_gray.astype(np.float32) / 255.0
    dct = np.abs(np.fft.fft2(face))
    block = dct[:16, :8].reshape(-1)  # 128 dims
    norm = float(np.linalg.norm(block))
    if norm <= 1e-9:
        return [0.0] * EMBEDDING_DIM
    vec = (block / norm).astype(np.float32)
    return vec.tolist()


def extract_face_embedding(file_bytes: bytes) -> tuple[list[float], float] | None:
    """
    Retourne (embedding, quality_score) ou None si visage non détecté.
    """
    if np is None:
        return None
    img = _to_bgr_array(file_bytes)
    if img is None:
        return None
    if cv2 is not None:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = np.dot(img[:, :, :3], [0.114, 0.587, 0.299]).astype(np.uint8)
    rect = _detect_face(gray)
    if rect is None:
        return None
    x, y, w, h = rect
    face = gray[y : y + h, x : x + w]
    if face.size == 0:
        return None
    emb = _embedding_from_face(face)
    quality = float((w * h) / max(1, gray.shape[0] * gray.shape[1]))
    return emb, min(max(quality, 0.0), 1.0)


def cosine_similarity(a: Iterable[float], b: Iterable[float]) -> float:
    if np is None:
        return 0.0
    va = np.asarray(list(a), dtype=np.float32)
    vb = np.asarray(list(b), dtype=np.float32)
    if va.size == 0 or vb.size == 0:
        return 0.0
    if va.size != vb.size:
        return 0.0
    na = float(np.linalg.norm(va))
    nb = float(np.linalg.norm(vb))
    if na <= 1e-9 or nb <= 1e-9:
        return 0.0
    return float(np.dot(va, vb) / (na * nb))
