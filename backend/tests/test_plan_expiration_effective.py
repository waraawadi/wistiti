from datetime import datetime, timedelta, timezone

import pytest
from django.utils import timezone as dj_timezone


@pytest.mark.django_db
def test_expired_plan_falls_back_to_free_event_quota(api_client):
    from apps.accounts.models import User
    from apps.paiements.models import Plan

    reg = api_client.post(
        "/api/auth/register/",
        {"email": "expired-events@example.com", "nom": "Expired Events", "password": "SuperSecret123"},
        format="json",
    )
    token = reg.data["access"]
    user = User.objects.get(email="expired-events@example.com")

    plan = Plan.objects.create(
        nom="ExpPlanEvents",
        prix_xof=1000,
        nb_uploads_max=999,
        nb_evenements_max=5,
        nb_albums_max=3,
        duree_jours=30,
    )
    user.plan_actif = plan
    user.expires_at = dj_timezone.now() - timedelta(days=1)
    user.save(update_fields=["plan_actif", "expires_at"])

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    first = api_client.post(
        "/api/evenements/",
        {"titre": "Event 1", "date": datetime(2026, 6, 1, 10, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    assert first.status_code == 201

    second = api_client.post(
        "/api/evenements/",
        {"titre": "Event 2", "date": datetime(2026, 6, 2, 10, 0, tzinfo=timezone.utc).isoformat()},
        format="json",
    )
    # Fallback quota gratuit = 1 événement
    assert second.status_code == 402


@pytest.mark.django_db
def test_usage_view_uses_free_limits_when_plan_expired(api_client):
    from apps.accounts.models import User
    from apps.paiements.models import Plan

    reg = api_client.post(
        "/api/auth/register/",
        {"email": "expired-usage@example.com", "nom": "Expired Usage", "password": "SuperSecret123"},
        format="json",
    )
    token = reg.data["access"]
    user = User.objects.get(email="expired-usage@example.com")

    plan = Plan.objects.create(
        nom="ExpPlanUsage",
        prix_xof=2500,
        nb_uploads_max=500,
        nb_evenements_max=9,
        nb_albums_max=8,
        duree_jours=30,
    )
    user.plan_actif = plan
    user.expires_at = dj_timezone.now() - timedelta(hours=1)
    user.save(update_fields=["plan_actif", "expires_at"])

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    usage = api_client.get("/api/paiements/usage/")
    assert usage.status_code == 200
    assert usage.data["plan"] == "Gratuit"
    assert usage.data["uploads_max"] == 50
    assert usage.data["evenements_max"] == 1
    assert usage.data["albums_per_event_max"] == 2
