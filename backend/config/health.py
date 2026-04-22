import time

import redis
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        started = time.perf_counter()
        out = {"status": "ok", "db": "ok", "redis": "ok", "storage": "ok", "config": "ok"}

        # DB + config
        try:
            from apps.appconfig.models import AppConfig

            cfg = AppConfig.load()
            if not (settings.HEX_RE.match(cfg.color_primary) and settings.HEX_RE.match(cfg.color_secondary) and settings.HEX_RE.match(cfg.color_white)):
                out["config"] = "invalid"
                out["status"] = "error"
        except Exception:
            out["db"] = "error"
            out["config"] = "error"
            out["status"] = "error"

        # Redis
        try:
            r = redis.from_url(settings.REDIS_URL, decode_responses=True)
            r.ping()
        except Exception:
            out["redis"] = "error"
            out["status"] = "error"

        # Storage write/delete
        try:
            name = f"healthchecks/{int(time.time())}.txt"
            default_storage.save(name, ContentFile(b"ok"))
            default_storage.delete(name)
        except Exception:
            out["storage"] = "error"
            out["status"] = "error"

        out["t_ms"] = int((time.perf_counter() - started) * 1000)
        return Response(out)

