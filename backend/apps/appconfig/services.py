from django.conf import settings

from .models import AppConfig


def get_resolved_public_config():
    """Fusionne la base et les surcharges d'environnement (priorité aux env)."""
    row = AppConfig.load()
    return {
        "app_name": settings.APP_NAME or row.app_name,
        "color_primary": settings.COLOR_PRIMARY or row.color_primary,
        "color_secondary": settings.COLOR_SECONDARY or row.color_secondary,
        "color_white": settings.COLOR_WHITE or row.color_white,
        "logo_url": row.logo_url or "",
        "topup_price_per_photo_xof": int(getattr(row, "topup_price_per_photo_xof", 25) or 25),
        "guest_download_price_per_photo_xof": int(getattr(row, "guest_download_price_per_photo_xof", 25) or 25),
    }
