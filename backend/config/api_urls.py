from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.evenements.views import MediaApproveView, MediaDeleteView
from config.health import HealthView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("config/", include("apps.appconfig.urls")),
    path("auth/", include("apps.accounts.urls")),
    path("admin/", include("apps.superadmin.urls")),
    # Compat / debug (peut être supprimé plus tard)
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("evenements/", include("apps.evenements.urls")),
    path("medias/<int:pk>/", MediaDeleteView.as_view(), name="medias-delete"),
    path("medias/<int:pk>/approuver/", MediaApproveView.as_view(), name="medias-approve"),
    path("paiements/", include("apps.paiements.urls")),
    path("photowall/", include("apps.photowall.urls")),
    path("moderation/", include("apps.moderation.urls")),
]
