import io
from datetime import datetime, timezone

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image


@pytest.mark.django_db
def test_register_returns_jwt(api_client):
    res = api_client.post(
        "/api/auth/register/",
        {"email": "a@example.com", "nom": "Alice", "password": "SuperSecret123"},
        format="json",
    )
    assert res.status_code == 201
    assert "access" in res.data and "refresh" in res.data


@pytest.mark.django_db
def test_login_returns_jwt(api_client):
    api_client.post(
        "/api/auth/register/",
        {"email": "b@example.com", "nom": "Bob", "password": "SuperSecret123"},
        format="json",
    )
    res = api_client.post(
        "/api/auth/login/",
        {"email": "b@example.com", "password": "SuperSecret123"},
        format="json",
    )
    assert res.status_code == 200
    assert "access" in res.data and "refresh" in res.data


@pytest.mark.django_db
def test_create_evenement_generates_slug_and_qrcode(api_client, settings):
    settings.PUBLIC_FRONTEND_BASE_URL = "http://localhost"
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "c@example.com", "nom": "Chloé", "password": "SuperSecret123"},
        format="json",
    )
    token = reg.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    payload = {
        "titre": "Mon Mariage",
        "date": datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc).isoformat(),
        "description": "Test",
    }
    res = api_client.post("/api/evenements/", payload, format="json")
    assert res.status_code == 201
    assert res.data["slug"]

    slug = res.data["slug"]
    qr = api_client.get(f"/api/evenements/{slug}/qrcode/")
    assert qr.status_code == 200
    assert qr.headers["Content-Type"].startswith("image/png")

    qr_pw = api_client.get(f"/api/evenements/{slug}/qrcode-photowall/")
    assert qr_pw.status_code == 200
    assert qr_pw.headers["Content-Type"].startswith("image/png")


@pytest.mark.django_db
def test_guest_upload_requires_file_and_accepts_image(api_client):
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "d@example.com", "nom": "Dan", "password": "SuperSecret123"},
        format="json",
    )
    token = reg.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    res = api_client.post(
        "/api/evenements/",
        {"titre": "Event", "date": datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    slug = res.data["slug"]

    api_client.credentials()  # invité
    bad = api_client.post(f"/api/evenements/{slug}/medias/", {}, format="multipart")
    assert bad.status_code == 400

    # PNG valide 1x1
    bio = io.BytesIO()
    Image.new("RGBA", (1, 1), (255, 0, 0, 255)).save(bio, format="PNG")
    up = SimpleUploadedFile("x.png", bio.getvalue(), content_type="image/png")
    ok = api_client.post(
        f"/api/evenements/{slug}/medias/",
        {"fichier": up, "legende": "hello"},
        format="multipart",
    )
    assert ok.status_code == 201
    assert ok.data["type"] == "photo"


@pytest.mark.django_db
def test_upload_rejects_unsupported_mime(api_client):
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "mime@example.com", "nom": "Mime", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
    evt = api_client.post(
        "/api/evenements/",
        {"titre": "MimeEvent", "date": datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    slug = evt.data["slug"]

    api_client.credentials()
    up = SimpleUploadedFile("x.gif", b"GIF89a", content_type="image/gif")
    res = api_client.post(f"/api/evenements/{slug}/medias/", {"fichier": up}, format="multipart")
    assert res.status_code == 400


@pytest.mark.django_db
def test_moderation_active_forces_pending_and_owner_can_approve(api_client, settings):
    settings.PUBLIC_FRONTEND_BASE_URL = "http://localhost"

    reg = api_client.post(
        "/api/auth/register/",
        {"email": "owner@example.com", "nom": "Owner", "password": "SuperSecret123"},
        format="json",
    )
    token = reg.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    evt = api_client.post(
        "/api/evenements/",
        {"titre": "ModEvent", "date": datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    slug = evt.data["slug"]

    # active la modération
    api_client.patch(f"/api/evenements/{slug}/", {"moderation_active": True}, format="json")

    # upload invité => approuve False
    api_client.credentials()
    bio = io.BytesIO()
    Image.new("RGB", (10, 10), (0, 0, 0)).save(bio, format="JPEG")
    up = SimpleUploadedFile("x.jpg", bio.getvalue(), content_type="image/jpeg")
    created = api_client.post(f"/api/evenements/{slug}/medias/", {"fichier": up}, format="multipart")
    assert created.status_code == 201
    assert created.data["approuve"] is False

    media_id = created.data["id"]

    # autre user ne peut pas approuver
    reg2 = api_client.post(
        "/api/auth/register/",
        {"email": "other@example.com", "nom": "Other", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg2.data['access']}")
    forbidden = api_client.patch(f"/api/medias/{media_id}/approuver/", {"approved": True}, format="json")
    assert forbidden.status_code == 403

    # owner approuve
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    ok = api_client.patch(f"/api/medias/{media_id}/approuver/", {"approved": True}, format="json")
    assert ok.status_code == 200
    assert ok.data["approuve"] is True


@pytest.mark.django_db
def test_album_quota_enforced(api_client):
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "albq@example.com", "nom": "A", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
    evt = api_client.post(
        "/api/evenements/",
        {"titre": "E", "date": datetime(2026, 4, 2, 10, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    slug = evt.data["slug"]
    ok = api_client.post(f"/api/evenements/{slug}/albums/", {"nom": "Famille", "is_public": False}, format="json")
    assert ok.status_code == 201
    blocked = api_client.post(f"/api/evenements/{slug}/albums/", {"nom": "VIP", "is_public": False}, format="json")
    assert blocked.status_code == 402


@pytest.mark.django_db
def test_upload_uses_credits_when_quota_reached(api_client):
    from apps.accounts.models import User
    from apps.paiements.models import Plan

    reg = api_client.post(
        "/api/auth/register/",
        {"email": "cred@example.com", "nom": "C", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
    user = User.objects.get(email="cred@example.com")
    plan = Plan.objects.create(nom="Mini", prix_xof=0, nb_uploads_max=1, nb_evenements_max=1, nb_albums_max=2, duree_jours=30)
    user.plan_actif = plan
    user.upload_credits = 1
    user.save(update_fields=["plan_actif", "upload_credits"])

    evt = api_client.post(
        "/api/evenements/",
        {"titre": "Event", "date": datetime(2026, 4, 2, 10, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    slug = evt.data["slug"]

    # invité upload 1 => ok
    api_client.credentials()
    bio = io.BytesIO()
    Image.new("RGBA", (1, 1), (255, 0, 0, 255)).save(bio, format="PNG")
    up = SimpleUploadedFile("x.png", bio.getvalue(), content_type="image/png")
    ok1 = api_client.post(f"/api/evenements/{slug}/medias/?album=public", {"fichier": up}, format="multipart")
    assert ok1.status_code == 201

    # 2e upload dépasse quota => consomme 1 crédit et passe
    bio2 = io.BytesIO()
    Image.new("RGBA", (1, 1), (0, 255, 0, 255)).save(bio2, format="PNG")
    up2 = SimpleUploadedFile("y.png", bio2.getvalue(), content_type="image/png")
    ok2 = api_client.post(f"/api/evenements/{slug}/medias/?album=public", {"fichier": up2}, format="multipart")
    assert ok2.status_code == 201

    user.refresh_from_db()
    assert user.upload_credits == 0

