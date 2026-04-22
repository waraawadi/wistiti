"""Convertisseur : un segment d’URL = exactement 3 lettres + 3 chiffres (ex. ABC123)."""

from __future__ import annotations


class PublicAlbumCodeConverter:
    regex = "[A-Za-z]{3}\\d{3}"

