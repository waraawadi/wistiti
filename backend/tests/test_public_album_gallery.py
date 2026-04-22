"""Galerie publique / par codes : album public vs album privé (galerie scindée)."""

import io
from datetime import datetime, timezone

import pytest
from django.core.files.base import ContentFile
from PIL import Image

from apps.evenements.models import Album, Evenement, Media


def _tiny_jpeg_bytes() -> bytes:
    bio = io.BytesIO()
    Image.new("RGB", (4, 4), (1, 2, 3)).save(bio, format="JPEG")
    return bio.getvalue()


@pytest.mark.django_db
def test_public_album_by_codes_lists_only_that_album_approved(api_client):
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "gal1@example.com", "nom": "G1", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
    evt = api_client.post(
        "/api/evenements/",
        {"titre": "Fête", "date": datetime(2026, 4, 2, 12, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    evt_obj = Evenement.objects.get(slug=evt.data["slug"])
    pub = Album.objects.get(evenement=evt_obj, slug="public")
    other = Album.objects.create(evenement=evt_obj, nom="Suite", is_public=True)

    m_pub = Media(
        evenement=evt_obj,
        album=pub,
        type=Media.MediaType.PHOTO,
        approuve=True,
        legende="a",
    )
    m_pub.fichier.save("a.jpg", ContentFile(_tiny_jpeg_bytes()), save=True)

    m_other = Media(
        evenement=evt_obj,
        album=other,
        type=Media.MediaType.PHOTO,
        approuve=True,
        legende="b",
    )
    m_other.fichier.save("b.jpg", ContentFile(_tiny_jpeg_bytes()), save=True)

    api_client.credentials()
    r = api_client.get(f"/api/evenements/by-code/{evt_obj.public_code}/{pub.public_code}/album/?page=1")
    assert r.status_code == 200
    assert r.data.get("galerie_split") is False
    ids = [x["id"] for x in r.data["medias"]]
    assert m_pub.id in ids
    assert m_other.id not in ids


@pytest.mark.django_db
def test_private_album_by_codes_meta_and_sections(api_client):
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "gal2@example.com", "nom": "G2", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")

    evt_res = api_client.post(
        "/api/evenements/",
        {"titre": "Priv Party", "date": datetime(2026, 4, 2, 12, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    slug = evt_res.data["slug"]
    evt_obj = Evenement.objects.get(slug=slug)
    pub_album = Album.objects.get(evenement=evt_obj, slug="public")

    priv_album = api_client.post(
        f"/api/evenements/{slug}/albums/",
        {"nom": "VIP", "is_public": False},
        format="json",
    )
    assert priv_album.status_code == 201
    priv = Album.objects.get(evenement=evt_obj, slug=priv_album.data["slug"])

    m1 = Media(evenement=evt_obj, album=pub_album, type=Media.MediaType.PHOTO, approuve=True)
    m1.fichier.save("p.jpg", ContentFile(_tiny_jpeg_bytes()), save=True)
    m2 = Media(evenement=evt_obj, album=priv, type=Media.MediaType.PHOTO, approuve=True)
    m2.fichier.save("v.jpg", ContentFile(_tiny_jpeg_bytes()), save=True)

    api_client.credentials()
    meta = api_client.get(f"/api/evenements/by-code/{evt_obj.public_code}/{priv.public_code}/album/?page=1")
    assert meta.status_code == 200
    assert meta.data["galerie_split"] is True
    assert meta.data["section_counts"]["public"] == 1
    assert meta.data["section_counts"]["private"] == 1
    assert meta.data["medias"] == []

    rp = api_client.get(
        f"/api/evenements/by-code/{evt_obj.public_code}/{priv.public_code}/album/?page=1&section=public"
    )
    assert rp.status_code == 200
    assert [x["id"] for x in rp.data["medias"]] == [m1.id]

    rv = api_client.get(
        f"/api/evenements/by-code/{evt_obj.public_code}/{priv.public_code}/album/?page=1&section=private"
    )
    assert rv.status_code == 200
    assert [x["id"] for x in rv.data["medias"]] == [m2.id]

    bad_page = api_client.get(
        f"/api/evenements/by-code/{evt_obj.public_code}/{priv.public_code}/album/?page=2"
    )
    assert bad_page.status_code == 400


@pytest.mark.django_db
def test_private_qr_private_section_only_this_album(api_client):
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "galiso@example.com", "nom": "G", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
    evt_res = api_client.post(
        "/api/evenements/",
        {"titre": "Iso", "date": datetime(2026, 4, 2, 12, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    slug = evt_res.data["slug"]
    evt_obj = Evenement.objects.get(slug=slug)
    pub_album = Album.objects.get(evenement=evt_obj, slug="public")
    vip = api_client.post(f"/api/evenements/{slug}/albums/", {"nom": "VIP", "is_public": False}, format="json")
    assert vip.status_code == 201
    priv_a = Album.objects.get(evenement=evt_obj, slug=vip.data["slug"])
    priv_b = Album.objects.create(evenement=evt_obj, nom="VIP2", is_public=False)
    priv_b.save()

    m0 = Media(evenement=evt_obj, album=pub_album, type=Media.MediaType.PHOTO, approuve=True)
    m0.fichier.save("0.jpg", ContentFile(_tiny_jpeg_bytes()), save=True)
    ma = Media(evenement=evt_obj, album=priv_a, type=Media.MediaType.PHOTO, approuve=True)
    ma.fichier.save("a.jpg", ContentFile(_tiny_jpeg_bytes()), save=True)
    mb = Media(evenement=evt_obj, album=priv_b, type=Media.MediaType.PHOTO, approuve=True)
    mb.fichier.save("b.jpg", ContentFile(_tiny_jpeg_bytes()), save=True)

    api_client.credentials()
    meta = api_client.get(f"/api/evenements/by-code/{evt_obj.public_code}/{priv_a.public_code}/album/?page=1")
    assert meta.data["section_counts"]["public"] == 1
    assert meta.data["section_counts"]["private"] == 1
    rv = api_client.get(
        f"/api/evenements/by-code/{evt_obj.public_code}/{priv_a.public_code}/album/?page=1&section=private"
    )
    assert [x["id"] for x in rv.data["medias"]] == [ma.id]
    assert mb.id not in [x["id"] for x in rv.data["medias"]]


@pytest.mark.django_db
def test_photowall_playlist_includes_public_and_private_albums(api_client):
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "pw@example.com", "nom": "PW", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
    evt_res = api_client.post(
        "/api/evenements/",
        {"titre": "Mur", "date": datetime(2026, 4, 2, 12, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    slug = evt_res.data["slug"]
    evt_obj = Evenement.objects.get(slug=slug)
    pub_album = Album.objects.get(evenement=evt_obj, slug="public")
    priv = api_client.post(
        f"/api/evenements/{slug}/albums/",
        {"nom": "Back", "is_public": False},
        format="json",
    )
    assert priv.status_code == 201
    priv_album = Album.objects.get(evenement=evt_obj, slug=priv.data["slug"])

    mp = Media(evenement=evt_obj, album=pub_album, type=Media.MediaType.PHOTO, approuve=True)
    mp.fichier.save("pp.jpg", ContentFile(_tiny_jpeg_bytes()), save=True)
    mv = Media(evenement=evt_obj, album=priv_album, type=Media.MediaType.PHOTO, approuve=True)
    mv.fichier.save("pv.jpg", ContentFile(_tiny_jpeg_bytes()), save=True)

    api_client.credentials()
    r = api_client.get(f"/api/evenements/{slug}/photowall/medias/")
    assert r.status_code == 200
    ids = {x["id"] for x in r.data["medias"]}
    assert mp.id in ids and mv.id in ids
    assert "qrcode_url" in r.data["evenement"]
    assert "/albums/public/qrcode/" in r.data["evenement"]["qrcode_url"]

    qr = api_client.get(f"/api/evenements/{slug}/albums/public/qrcode/")
    assert qr.status_code == 200
    assert qr.headers["Content-Type"].startswith("image/png")


@pytest.mark.django_db
def test_only_one_public_album_per_event(api_client):
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "onepub@example.com", "nom": "O", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
    evt_res = api_client.post(
        "/api/evenements/",
        {"titre": "E", "date": datetime(2026, 4, 2, 12, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    slug = evt_res.data["slug"]
    dup = api_client.post(
        f"/api/evenements/{slug}/albums/",
        {"nom": "Deuxième public", "is_public": True},
        format="json",
    )
    assert dup.status_code == 400
    assert dup.data.get("code") == "SINGLE_PUBLIC_ALBUM_ONLY"
    priv = api_client.post(
        f"/api/evenements/{slug}/albums/",
        {"nom": "Privé OK", "is_public": False},
        format="json",
    )
    assert priv.status_code == 201


@pytest.mark.django_db
def test_delete_private_album_and_block_public_album(api_client):
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "delalb@example.com", "nom": "D", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
    evt_res = api_client.post(
        "/api/evenements/",
        {"titre": "Del", "date": datetime(2026, 4, 2, 12, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    slug = evt_res.data["slug"]
    extra = api_client.post(f"/api/evenements/{slug}/albums/", {"nom": "Temp", "is_public": False}, format="json")
    assert extra.status_code == 201
    eslug = extra.data["slug"]
    gone = api_client.delete(f"/api/evenements/{slug}/albums/{eslug}/")
    assert gone.status_code == 204
    block = api_client.delete(f"/api/evenements/{slug}/albums/public/")
    assert block.status_code == 400
    assert block.data.get("code") == "CANNOT_DELETE_DEFAULT_PUBLIC_ALBUM"
