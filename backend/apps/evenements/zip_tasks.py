import os
import zipfile

from celery import shared_task
from django.conf import settings

from .models import Evenement


def _zip_path_for(slug: str) -> str:
    out_dir = os.path.join(settings.MEDIA_ROOT, "exports")
    os.makedirs(out_dir, exist_ok=True)
    return os.path.join(out_dir, f"{slug}.zip")


@shared_task
def generate_event_zip_task(evenement_id: int) -> str:
    evt = Evenement.objects.prefetch_related("medias").get(pk=evenement_id)
    out_path = _zip_path_for(evt.slug)

    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for m in evt.medias.all().order_by("created_at"):
            if not m.fichier:
                continue
            try:
                file_path = m.fichier.path
            except Exception:
                # Storage distant : pas de path local.
                continue
            arcname = os.path.join("medias", os.path.basename(file_path))
            if os.path.exists(file_path):
                zf.write(file_path, arcname=arcname)

    return out_path


def generate_event_zip(evenement_id: int) -> str:
    """
    Pour un MVP : on génère synchro si possible (tests/dev), sinon le worker peut le faire.
    """
    return generate_event_zip_task(evenement_id)


def generate_selected_media_zip(*, slug: str, medias) -> str:
    """
    ZIP à la demande pour une sélection (invités).
    Compatible storage local et distant (fallback via open()).
    """
    out_dir = os.path.join(settings.MEDIA_ROOT, "exports", "guest")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{slug}.zip")

    from django.core.files.storage import default_storage

    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for m in medias:
            if not getattr(m, "fichier", None):
                continue
            # Nom stable dans le zip
            arcname = os.path.join("medias", os.path.basename(getattr(m.fichier, "name", "") or f"{m.id}"))
            try:
                file_path = m.fichier.path
                if os.path.exists(file_path):
                    zf.write(file_path, arcname=arcname)
                    continue
            except Exception:
                pass
            # Storage distant : stream
            try:
                with default_storage.open(m.fichier.name, "rb") as f:
                    zf.writestr(arcname, f.read())
            except Exception:
                continue

    return out_path

