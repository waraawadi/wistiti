"""Codes courts pour QR : 3 lettres + 3 chiffres (ex. ABC123)."""
from __future__ import annotations

import random
import re
import string

CODE_PATTERN = re.compile(r"^[A-Za-z]{3}\d{3}$")


def normalize_public_code(value: str) -> str:
    return (value or "").strip().upper()


def is_valid_public_code(value: str) -> bool:
    return bool(CODE_PATTERN.match((value or "").strip()))


def _random_code() -> str:
    letters = "".join(random.choices(string.ascii_uppercase, k=3))
    digits = "".join(random.choices(string.digits, k=3))
    return letters + digits


def generate_unique_event_code(model_cls) -> str:
    """Globalement unique sur Evenement.public_code."""
    for _ in range(10_000):
        c = _random_code()
        if not model_cls.objects.filter(public_code=c).exists():
            return c
    raise RuntimeError("Impossible de générer un code événement unique.")


def generate_unique_album_code(evenement_id: int, album_model_cls) -> str:
    """Unique par événement (evenement_id + public_code)."""
    for _ in range(10_000):
        c = _random_code()
        if not album_model_cls.objects.filter(evenement_id=evenement_id, public_code=c).exists():
            return c
    raise RuntimeError("Impossible de générer un code album unique.")
