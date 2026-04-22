import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image


@pytest.mark.django_db
def test_guest_upload_quota_blocked_payload_and_notifier(api_client, monkeypatch):
    from apps.accounts.models import User
    from apps.evenements.models import Album, Evenement, Media
    from apps.paiements.models import Plan

    notified: list[object] = []

    def capture_delay(*args, **kwargs):
        notified.append((args, kwargs))

    monkeypatch.setattr(
        "apps.evenements.views.notify_organizer_guest_quota_blocked.delay",
        capture_delay,
    )

    owner = User.objects.create_user(email="org@example.com", password="x", nom="Marie Organisatrice")
    plan = Plan.objects.create(
        nom="Quotas2",
        prix_xof=0,
        nb_uploads_max=1,
        nb_evenements_max=5,
        nb_albums_max=3,
        duree_jours=30,
    )
    owner.plan_actif = plan
    owner.save(update_fields=["plan_actif"])

    evt = Evenement.objects.create(
        user=owner,
        titre="Mariage Test",
        date=timezone.now(),
        public_code="ZZZ999",
    )
    album = Album.objects.create(evenement=evt, nom="Public", slug="public", is_public=True, public_code="YYY888")
    Media.objects.create(evenement=evt, album=album, fichier="m.jpg", type="photo", approuve=True)

    api_client.credentials()
    bio = io.BytesIO()
    Image.new("RGB", (2, 2), (0, 0, 0)).save(bio, format="JPEG")
    up = SimpleUploadedFile("n.jpg", bio.getvalue(), content_type="image/jpeg")

    res = api_client.post(
        f"/api/evenements/by-code/{evt.public_code}/{album.public_code}/medias/",
        {"fichier": up},
        format="multipart",
    )
    assert res.status_code == 402
    assert res.data.get("code") == "GUEST_QUOTA_FULL"
    assert res.data["organizer"]["email"] == "org@example.com"
    assert res.data["organizer"]["nom"] == "Marie Organisatrice"
    assert res.data["evenement"]["titre"] == "Mariage Test"
    assert len(notified) == 1
