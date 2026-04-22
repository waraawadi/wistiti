from io import BytesIO

from celery import shared_task
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import send_mail

from PIL import Image, ImageOps

from .models import Media


@shared_task
def notify_organizer_guest_quota_blocked(
    organizer_email: str,
    organizer_name: str,
    event_title: str,
    event_public_code: str,
    album_nom: str,
) -> str:
    """Avertit l’organisateur que des invités ne peuvent plus uploader (quota photos)."""
    if not organizer_email:
        return "skip"
    body = (
        f"Bonjour{(' ' + organizer_name) if organizer_name.strip() else ''},\n\n"
        f"Des invités ont tenté d’ajouter des médias sur l’événement « {event_title} » "
        f"(code {event_public_code}), album « {album_nom} », mais le quota photos de votre plan est atteint.\n\n"
        f"Pensez à passer à un plan supérieur ou à acheter des crédits photos depuis votre tableau de bord "
        f"({settings.PUBLIC_FRONTEND_BASE_URL}/dashboard/abonnements).\n\n"
        f"— {settings.APP_NAME or 'PhotoEvent'}"
    )
    send_mail(
        subject=f"Quota photos atteint — {event_title}",
        message=body,
        from_email=None,
        recipient_list=[organizer_email],
        fail_silently=True,
    )
    return "ok"


@shared_task
def process_photo(media_id: int) -> str:
    """
    Optimisations côté worker :
    - Compression si > 2Mo (JPEG, qualité 85%)
    - Resize max 2048px
    - Génération miniature carrée 400x400
    """
    media = Media.objects.get(pk=media_id)
    if media.type != Media.MediaType.PHOTO:
        return "skip"

    f = media.fichier
    f.open("rb")
    try:
        try:
            img = Image.open(f)
        except Exception:
            # Format non supporté par Pillow (ex: HEIC sans plugin) → on n'échoue pas l'upload
            return "unsupported"

        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")

        # resize max 2048
        max_side = 2048
        if max(img.size) > max_side:
            img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

        # compression uniquement si > 2Mo
        should_compress = getattr(media.fichier, "size", 0) > 2 * 1024 * 1024
        if should_compress:
            bio = BytesIO()
            img.save(bio, format="JPEG", quality=85, optimize=True)
            new_name = f.name.rsplit(".", 1)[0] + ".jpg"
            media.fichier.save(new_name, ContentFile(bio.getvalue()), save=False)

        # thumbnail 400x400
        thumb = img.copy()
        thumb_size = 400
        thumb.thumbnail((thumb_size, thumb_size), Image.Resampling.LANCZOS)
        # centrage carré
        square = Image.new("RGB", (thumb_size, thumb_size), (255, 255, 255))
        x = (thumb_size - thumb.size[0]) // 2
        y = (thumb_size - thumb.size[1]) // 2
        square.paste(thumb, (x, y))
        bio_t = BytesIO()
        square.save(bio_t, format="JPEG", quality=85, optimize=True)
        media.thumbnail.save(
            f"thumb_{media.pk}.jpg",
            ContentFile(bio_t.getvalue()),
            save=False,
        )

        media.save(update_fields=["fichier", "thumbnail"])
        return "ok"
    finally:
        f.close()

