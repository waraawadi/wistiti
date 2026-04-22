from io import BytesIO

from django.core.files.base import ContentFile

import qrcode

from apps.appconfig.services import get_resolved_public_config


def build_qr_png_bytes(url: str, *, fill_color: str) -> bytes:

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fill_color, back_color="white").convert("RGBA")
    bio = BytesIO()
    img.save(bio, format="PNG")
    return bio.getvalue()


def make_qr_content_file(url: str, filename: str) -> ContentFile:
    cfg = get_resolved_public_config()
    return ContentFile(build_qr_png_bytes(url, fill_color=cfg["color_primary"]), name=filename)


def build_photowall_qr_bytes(url: str) -> bytes:
    cfg = get_resolved_public_config()
    return build_qr_png_bytes(url, fill_color=cfg["color_secondary"])

