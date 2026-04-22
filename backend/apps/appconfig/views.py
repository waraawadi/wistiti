from django.utils.decorators import method_decorator
from django.core.cache import cache
from django.core.files.storage import default_storage
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, MultiPartParser

from .models import AppConfig
from .serializers import AppConfigUpdateSerializer
from .services import get_resolved_public_config


@method_decorator(ratelimit(key="ip", rate="200/m", method="GET"), name="get")
class AppConfigView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "PATCH":
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request):
        cached = cache.get("config:public")
        if cached:
            return Response(cached)
        payload = get_resolved_public_config()
        cache.set("config:public", payload, timeout=300)
        return Response(payload)

    def patch(self, request):
        instance = AppConfig.load()
        data = request.data.copy()
        logo = request.FILES.get("logo")
        if logo:
            name = default_storage.save(f"branding/logo/{logo.name}", logo)
            data["logo_url"] = request.build_absolute_uri(default_storage.url(name))

        serializer = AppConfigUpdateSerializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        cache.delete("config:public")
        return Response(get_resolved_public_config(), status=status.HTTP_200_OK)
