from django.urls import path

from .views import (
    AlbumQRCodeByCodesView,
    AlbumQRCodeView,
    EvenementAlbumDetailView,
    EvenementAlbumsView,
    EvenementDownloadZipView,
    EvenementDetailView,
    EvenementListCreateView,
    EvenementMediaByCodesView,
    EvenementMediaView,
    EvenementPhotoWallPlaylistView,
    EvenementPhotoWallQRCodeView,
    EvenementQRCodeView,
    OrganizerDashboardStatsView,
    PublicAlbumByCodesView,
    PublicAlbumView,
)

urlpatterns = [
    path("dashboard-stats/", OrganizerDashboardStatsView.as_view(), name="evenements-dashboard-stats"),
    path("", EvenementListCreateView.as_view(), name="evenements-list-create"),
    path(
        "by-code/<str:event_code>/<str:album_code>/album/",
        PublicAlbumByCodesView.as_view(),
        name="evenements-album-public-by-codes",
    ),
    path(
        "by-code/<str:event_code>/<str:album_code>/medias/",
        EvenementMediaByCodesView.as_view(),
        name="evenements-medias-by-codes",
    ),
    path(
        "by-code/<str:event_code>/<str:album_code>/qrcode/",
        AlbumQRCodeByCodesView.as_view(),
        name="evenements-album-qrcode-by-codes",
    ),
    path("<slug:slug>/", EvenementDetailView.as_view(), name="evenements-detail"),
    path("<slug:slug>/album/", PublicAlbumView.as_view(), name="evenements-album-public"),
    path("<slug:slug>/albums/", EvenementAlbumsView.as_view(), name="evenements-albums"),
    path("<slug:slug>/albums/<slug:album_slug>/", EvenementAlbumDetailView.as_view(), name="evenements-albums-detail"),
    path("<slug:slug>/albums/<slug:album_slug>/album/", PublicAlbumView.as_view(), name="evenements-album-public-by-album"),
    path("<slug:slug>/albums/<slug:album_slug>/qrcode/", AlbumQRCodeView.as_view(), name="evenements-album-qrcode"),
    path("<slug:slug>/medias/", EvenementMediaView.as_view(), name="evenements-medias"),
    path("<slug:slug>/qrcode/", EvenementQRCodeView.as_view(), name="evenements-qrcode"),
    path("<slug:slug>/photowall/medias/", EvenementPhotoWallPlaylistView.as_view(), name="evenements-photowall-medias"),
    path("<slug:slug>/qrcode-photowall/", EvenementPhotoWallQRCodeView.as_view(), name="evenements-qrcode-photowall"),
    path("<slug:slug>/download-zip/", EvenementDownloadZipView.as_view(), name="evenements-download-zip"),
]
