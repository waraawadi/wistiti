from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, register_converter

from apps.evenements.qr_entry import QrAlbumEntryRedirectView
from apps.evenements.url_converters import PublicAlbumCodeConverter

register_converter(PublicAlbumCodeConverter, "pubcode")

urlpatterns = [
    path("admin/", admin.site.urls),
    # Entrée courte côté backend (optionnelle) : /{code_evt}/{code_album}/ → redirect vers PUBLIC_FRONTEND_BASE_URL
    path(
        "<pubcode:event_code>/<pubcode:album_code>/",
        QrAlbumEntryRedirectView.as_view(),
        name="qr-album-entry",
    ),
    path("api/", include("config.api_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
