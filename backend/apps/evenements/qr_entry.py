"""Redirection racine API : /EVT/alb/ → frontend /EVT/alb/."""
from __future__ import annotations

from django.conf import settings
from django.http import Http404, HttpResponseRedirect
from django.views import View

from .codes import is_valid_public_code, normalize_public_code


class QrAlbumEntryRedirectView(View):
    """Redirection legacy : scan d’un QR pointant encore vers le backend /{code_evt}/{code_album}/."""

    def get(self, request, event_code: str, album_code: str):
        ec = normalize_public_code(event_code)
        ac = normalize_public_code(album_code)
        if not is_valid_public_code(ec) or not is_valid_public_code(ac):
            raise Http404()
        target = f"{settings.PUBLIC_FRONTEND_BASE_URL.rstrip('/')}/{ec}/{ac}"
        return HttpResponseRedirect(target)
