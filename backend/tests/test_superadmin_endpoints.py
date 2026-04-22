from datetime import datetime, timezone

import pytest


@pytest.mark.django_db
def test_superadmin_endpoints_require_admin(api_client):
    # non auth
    r = api_client.get("/api/admin/users/")
    assert r.status_code in (401, 403)
    r2 = api_client.get("/api/admin/billing-prices/")
    assert r2.status_code in (401, 403)


@pytest.mark.django_db
def test_superadmin_can_list_users_and_plans(api_client):
    # create superuser
    from apps.accounts.models import User
    from rest_framework_simplejwt.tokens import RefreshToken

    su = User.objects.create_superuser(email="sa@example.com", password="SuperSecret123", nom="SA")
    token = str(RefreshToken.for_user(su).access_token)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    r = api_client.get("/api/admin/users/")
    assert r.status_code == 200

    r2 = api_client.get("/api/admin/plans/")
    assert r2.status_code == 200

    r3 = api_client.get("/api/admin/billing-prices/")
    assert r3.status_code == 200
    assert "topup_price_per_photo_xof" in r3.data
    assert "guest_download_price_per_photo_xof" in r3.data


@pytest.mark.django_db
def test_superadmin_can_update_billing_prices(api_client):
    from apps.accounts.models import User
    from apps.appconfig.models import AppConfig
    from rest_framework_simplejwt.tokens import RefreshToken

    su = User.objects.create_superuser(email="sa3@example.com", password="SuperSecret123", nom="SA3")
    token = str(RefreshToken.for_user(su).access_token)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    updated = api_client.patch(
        "/api/admin/billing-prices/",
        {"topup_price_per_photo_xof": 30, "guest_download_price_per_photo_xof": 45},
        format="json",
    )
    assert updated.status_code == 200
    assert updated.data["topup_price_per_photo_xof"] == 30
    assert updated.data["guest_download_price_per_photo_xof"] == 45

    cfg = AppConfig.load()
    assert cfg.topup_price_per_photo_xof == 30
    assert cfg.guest_download_price_per_photo_xof == 45


@pytest.mark.django_db
def test_superadmin_can_list_evenements(api_client):
    from apps.accounts.models import User
    from rest_framework_simplejwt.tokens import RefreshToken

    su = User.objects.create_superuser(email="sa2@example.com", password="SuperSecret123", nom="SA2")
    u = User.objects.create_user(email="u@example.com", password="SuperSecret123", nom="U")
    token = str(RefreshToken.for_user(su).access_token)

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    # create event for user via ORM
    from apps.evenements.models import Evenement

    Evenement.objects.create(
        user=u,
        titre="Event",
        date=datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc),
        description="",
    )

    r = api_client.get("/api/admin/evenements/")
    assert r.status_code == 200
    assert len(r.data) >= 1

