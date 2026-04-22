import json
from datetime import timedelta

import pytest
from django.utils import timezone


@pytest.mark.django_db
def test_fedapay_sandbox_flow_e2e_mocked(api_client, monkeypatch, settings):
    """
    Test "E2E" en sandbox : on mock le SDK FedaPay (pas d'appel réseau),
    on initie, puis on simule un webhook transaction.approved.
    """
    settings.FEDAPAY_API_KEY = "sk_sandbox_xxx"
    settings.FEDAPAY_ENV = "sandbox"
    settings.PUBLIC_BACKEND_BASE_URL = "http://localhost"
    settings.FEDAPAY_WEBHOOK_SECRET = ""  # on accepte sans signature dans ce test

    # Crée un plan
    from apps.paiements.models import Plan, Paiement
    from apps.accounts.models import User

    plan = Plan.objects.create(nom="Plus", prix_xof=9900, nb_uploads_max=500, duree_jours=30, hq_enabled=True, moderation_enabled=True)

    # Mock HTTP FedaPay (requests)
    class Resp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
            self.text = json.dumps(payload)

        def json(self):
            return self._payload

    def mock_post(url, json=None, headers=None, timeout=None):
        if url.endswith("/transactions"):
            assert json["amount"] == 9900
            assert json["currency"]["iso"] == "XOF"
            assert "merchant_reference" in json and str(json["merchant_reference"]).startswith("photoevent-u")
            assert json["customer"]["email"] == "pay@example.com"
            assert json["customer"]["firstname"] == "Pay"
            assert json["customer"]["lastname"] == "User"
            # Doc FedaPay : le lien vient souvent de POST /transactions/{id}/token, pas du create.
            return Resp(201, {"id": 123, "status": "pending"})
        if url.endswith("/transactions/123/token"):
            return Resp(200, {"url": "https://sandbox.fedapay.com/pay/123", "token": "tok_xxx"})
        raise AssertionError(f"unexpected POST {url}")

    def mock_get(url, headers=None, timeout=None):
        assert url.endswith("/transactions/123")
        return Resp(200, {"id": 123, "status": "approved"})

    import requests

    monkeypatch.setattr(requests, "post", mock_post)
    monkeypatch.setattr(requests, "get", mock_get)

    # Register
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "pay@example.com", "nom": "Pay User", "password": "SuperSecret123"},
        format="json",
    )
    token = reg.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    # Initier paiement
    res = api_client.post("/api/paiements/initier/", {"plan_id": plan.id}, format="json")
    assert res.status_code == 200
    assert res.data["payment_url"] == "https://sandbox.fedapay.com/pay/123"

    # Simule webhook approved
    api_client.credentials()
    wh = api_client.post(
        "/api/paiements/webhook/",
        data={"name": "transaction.approved", "data": {"id": 123}},
        format="json",
    )
    assert wh.status_code == 200

    user = User.objects.get(email="pay@example.com")
    assert user.plan_actif_id == plan.id
    assert user.expires_at is not None
    assert user.expires_at > timezone.now() + timedelta(days=29)

    p = Paiement.objects.get(user=user, fedapay_transaction_id="123")
    assert p.statut == "approved"
    assert p.expires_at is not None


@pytest.mark.django_db
def test_fedapay_init_id_on_parent_when_nested_transaction_empty(api_client, monkeypatch, settings):
    """
    FedaPay peut renvoyer v1.data avec un objet transaction vide/incomplet
    et l'id sur le parent — ne doit pas renvoyer 502 « id introuvable ».
    """
    settings.FEDAPAY_API_KEY = "sk_sandbox_xxx"
    settings.FEDAPAY_ENV = "sandbox"
    settings.PUBLIC_BACKEND_BASE_URL = "http://localhost"

    from apps.paiements.models import Plan

    plan = Plan.objects.create(
        nom="Test", prix_xof=100, nb_uploads_max=10, duree_jours=30, hq_enabled=False, moderation_enabled=False
    )

    class Resp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
            self.text = json.dumps(payload)

        def json(self):
            return self._payload

    def mock_post(url, json=None, headers=None, timeout=None):
        if url.endswith("/transactions"):
            assert "merchant_reference" in json
            return Resp(
                201,
                {"v1": {"transaction": {}, "id": 422198, "status": "pending"}},
            )
        if url.endswith("/transactions/422198/token"):
            return Resp(200, {"url": "https://sandbox.fedapay.com/pay/422198"})
        raise AssertionError(f"unexpected POST {url}")

    monkeypatch.setattr("requests.post", mock_post)

    reg = api_client.post(
        "/api/auth/register/",
        {"email": "nested@example.com", "nom": "N", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")

    res = api_client.post("/api/paiements/initier/", {"plan_id": plan.id}, format="json")
    assert res.status_code == 200
    assert res.data["transaction_id"] == "422198"
    assert "sandbox.fedapay.com" in res.data["payment_url"]


@pytest.mark.django_db
def test_fedapay_init_flat_klass_transaction(api_client, monkeypatch, settings):
    """Réponse plate du type { klass: v1/transaction, id, reference } (sandbox)."""
    settings.FEDAPAY_API_KEY = "sk_sandbox_xxx"
    settings.FEDAPAY_ENV = "sandbox"
    settings.PUBLIC_BACKEND_BASE_URL = "http://localhost"

    from apps.paiements.models import Plan

    plan = Plan.objects.create(
        nom="Test", prix_xof=100, nb_uploads_max=10, duree_jours=30, hq_enabled=False, moderation_enabled=False
    )

    class Resp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
            self.text = json.dumps(payload)

        def json(self):
            return self._payload

    def mock_post(url, json=None, headers=None, timeout=None):
        if url.endswith("/transactions"):
            assert "merchant_reference" in json
            return Resp(
                201,
                {
                    "klass": "v1/transaction",
                    "id": 422198,
                    "reference": "trx_198_x",
                    "amount": 100,
                    "status": "pending",
                },
            )
        if url.endswith("/transactions/422198/token"):
            return Resp(200, {"url": "https://sandbox.fedapay.com/pay/x"})
        raise AssertionError(f"unexpected POST {url}")

    monkeypatch.setattr("requests.post", mock_post)

    reg = api_client.post(
        "/api/auth/register/",
        {"email": "flat@example.com", "nom": "F", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")

    res = api_client.post("/api/paiements/initier/", {"plan_id": plan.id}, format="json")
    assert res.status_code == 200
    assert res.data["transaction_id"] == "422198"


@pytest.mark.django_db
def test_fedapay_init_checkout_js_skips_payment_url(api_client, monkeypatch, settings):
    """Mode checkout_js : succès sans appeler /transactions/{id}/token."""
    settings.FEDAPAY_API_KEY = "sk_sandbox_xxx"
    settings.FEDAPAY_ENV = "sandbox"
    settings.PUBLIC_BACKEND_BASE_URL = "http://localhost"

    from apps.paiements.models import Plan

    plan = Plan.objects.create(
        nom="Test", prix_xof=100, nb_uploads_max=10, duree_jours=30, hq_enabled=False, moderation_enabled=False
    )

    class Resp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
            self.text = json.dumps(payload)

        def json(self):
            return self._payload

    calls = []

    def mock_post(url, json=None, headers=None, timeout=None):
        calls.append(url)
        if url.endswith("/transactions"):
            assert "merchant_reference" in json
            assert json["customer"]["firstname"] == "Jean"
            assert json["customer"]["lastname"] == "Dupont"
            return Resp(201, {"id": 999, "status": "pending"})
        raise AssertionError(f"unexpected POST {url}")

    monkeypatch.setattr("requests.post", mock_post)

    reg = api_client.post(
        "/api/auth/register/",
        {"email": "jsmode@example.com", "nom": "Jean Dupont", "password": "SuperSecret123"},
        format="json",
    )
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")

    res = api_client.post(
        "/api/paiements/initier/",
        {"plan_id": plan.id, "checkout_mode": "checkout_js"},
        format="json",
    )
    assert res.status_code == 200
    assert res.data["checkout_mode"] == "checkout_js"
    assert res.data["payment_url"] is None
    assert res.data["transaction_id"] == "999"
    assert res.data["customer"]["email"] == "jsmode@example.com"
    assert res.data["customer"]["firstname"] == "Jean"
    assert res.data["customer"]["lastname"] == "Dupont"
    assert len([u for u in calls if "/token" in u]) == 0


@pytest.mark.django_db
def test_synchroniser_approved_activates_subscription(api_client, monkeypatch, settings):
    settings.FEDAPAY_API_KEY = "sk_sandbox_xxx"
    settings.FEDAPAY_ENV = "sandbox"

    from apps.accounts.models import User
    from apps.paiements.models import Paiement, Plan

    plan = Plan.objects.create(
        nom="Plus", prix_xof=5000, nb_uploads_max=100, duree_jours=30, hq_enabled=True, moderation_enabled=True
    )
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "sync@example.com", "nom": "S Ync", "password": "SuperSecret123"},
        format="json",
    )
    token = reg.data["access"]
    user = User.objects.get(email="sync@example.com")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    Paiement.objects.create(
        user=user,
        plan=plan,
        montant=plan.prix_xof,
        devise="XOF",
        statut="pending",
        fedapay_transaction_id="777",
    )

    class Resp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
            self.text = json.dumps(payload)

        def json(self):
            return self._payload

    def mock_get(url, headers=None, timeout=None):
        assert "/transactions/777" in url
        return Resp(200, {"id": 777, "status": "approved"})

    monkeypatch.setattr("requests.get", mock_get)
    monkeypatch.setattr("apps.paiements.views.send_payment_confirmation_email.delay", lambda *a, **kw: None)

    res = api_client.post("/api/paiements/synchroniser/", {"transaction_id": "777"}, format="json")
    assert res.status_code == 200
    assert res.data["activated"] is True
    assert res.data["plan"] == "Plus"

    user.refresh_from_db()
    assert user.plan_actif_id == plan.id
    assert user.expires_at is not None


@pytest.mark.django_db
def test_synchroniser_activates_when_only_approved_at(api_client, monkeypatch, settings):
    """Succès détecté via approved_at même si status est absent ou ambigu."""
    settings.FEDAPAY_API_KEY = "sk_sandbox_xxx"
    settings.FEDAPAY_ENV = "sandbox"

    from apps.accounts.models import User
    from apps.paiements.models import Paiement, Plan

    plan = Plan.objects.create(
        nom="Pro", prix_xof=2000, nb_uploads_max=200, duree_jours=30, hq_enabled=True, moderation_enabled=True
    )
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "tsat@example.com", "nom": "T At", "password": "SuperSecret123"},
        format="json",
    )
    user = User.objects.get(email="tsat@example.com")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")

    Paiement.objects.create(
        user=user,
        plan=plan,
        montant=plan.prix_xof,
        devise="XOF",
        statut="pending",
        fedapay_transaction_id="888",
    )

    class Resp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
            self.text = json.dumps(payload)

        def json(self):
            return self._payload

    def mock_get(url, headers=None, timeout=None):
        assert "/transactions/888" in url
        return Resp(
            200,
            {"v1": {"id": 888, "approved_at": "2026-04-01T12:00:00Z"}},
        )

    monkeypatch.setattr("requests.get", mock_get)
    monkeypatch.setattr("apps.paiements.views.send_payment_confirmation_email.delay", lambda *a, **kw: None)

    res = api_client.post("/api/paiements/synchroniser/", {"transaction_id": "888"}, format="json")
    assert res.status_code == 200
    assert res.data["activated"] is True
    user.refresh_from_db()
    assert user.plan_actif_id == plan.id


@pytest.mark.django_db
def test_synchroniser_transferred_activates_subscription(api_client, monkeypatch, settings):
    """Statut transferred (fonds sur compte marchand) active aussi l’abonnement."""
    settings.FEDAPAY_API_KEY = "sk_sandbox_xxx"
    settings.FEDAPAY_ENV = "sandbox"

    from apps.accounts.models import User
    from apps.paiements.models import Paiement, Plan

    plan = Plan.objects.create(
        nom="Biz", prix_xof=1, nb_uploads_max=5, duree_jours=7, hq_enabled=False, moderation_enabled=False
    )
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "tr@example.com", "nom": "T R", "password": "SuperSecret123"},
        format="json",
    )
    user = User.objects.get(email="tr@example.com")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
    Paiement.objects.create(
        user=user, plan=plan, montant=1, devise="XOF", statut="pending", fedapay_transaction_id="660"
    )

    class Resp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
            self.text = json.dumps(payload)

        def json(self):
            return self._payload

    def mock_get(url, headers=None, timeout=None):
        assert "/transactions/660" in url
        return Resp(200, {"id": 660, "status": "transferred"})

    monkeypatch.setattr("requests.get", mock_get)
    monkeypatch.setattr("apps.paiements.views.send_payment_confirmation_email.delay", lambda *a, **kw: None)

    res = api_client.post("/api/paiements/synchroniser/", {"transaction_id": "660"}, format="json")
    assert res.status_code == 200
    assert res.data["activated"] is True
    user.refresh_from_db()
    assert user.plan_actif_id == plan.id


@pytest.mark.django_db
def test_synchroniser_handles_key_v1_slash_transaction(api_client, monkeypatch, settings):
    """Certaines réponses sont enveloppées sous la clé 'v1/transaction'."""
    settings.FEDAPAY_API_KEY = "sk_sandbox_xxx"
    settings.FEDAPAY_ENV = "sandbox"

    from apps.accounts.models import User
    from apps.paiements.models import Paiement, Plan

    plan = Plan.objects.create(
        nom="Plan test", prix_xof=100, nb_uploads_max=10, duree_jours=30, hq_enabled=False, moderation_enabled=False
    )
    reg = api_client.post(
        "/api/auth/register/",
        {"email": "slash@example.com", "nom": "Slash Case", "password": "SuperSecret123"},
        format="json",
    )
    user = User.objects.get(email="slash@example.com")
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")

    Paiement.objects.create(
        user=user,
        plan=plan,
        montant=plan.prix_xof,
        devise="XOF",
        statut="pending",
        fedapay_transaction_id="423449",
    )

    class Resp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
            self.text = json.dumps(payload)

        def json(self):
            return self._payload

    def mock_get(url, headers=None, timeout=None):
        assert "/transactions/423449" in url
        return Resp(
            200,
            {
                "v1/transaction": {
                    "klass": "v1/transaction",
                    "id": 423449,
                    "status": "approved",
                    "approved_at": "2026-04-02T08:42:10.826Z",
                }
            },
        )

    monkeypatch.setattr("requests.get", mock_get)
    monkeypatch.setattr("apps.paiements.views.send_payment_confirmation_email.delay", lambda *a, **kw: None)

    res = api_client.post("/api/paiements/synchroniser/", {"transaction_id": "423449"}, format="json")
    assert res.status_code == 200
    assert res.data["activated"] is True
    user.refresh_from_db()
    assert user.plan_actif_id == plan.id


@pytest.mark.django_db
def test_synchroniser_approved_adds_topup_credits_once(api_client, monkeypatch, settings):
    settings.FEDAPAY_API_KEY = "sk_sandbox_xxx"
    settings.FEDAPAY_ENV = "sandbox"

    from apps.accounts.models import User
    from apps.paiements.models import PhotoTopUp

    reg = api_client.post(
        "/api/auth/register/",
        {"email": "topup-sync@example.com", "nom": "Top Up", "password": "SuperSecret123"},
        format="json",
    )
    token = reg.data["access"]
    user = User.objects.get(email="topup-sync@example.com")
    user.upload_credits = 0
    user.save(update_fields=["upload_credits"])
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    PhotoTopUp.objects.create(
        user=user,
        quantity=15,
        price_per_photo_xof=25,
        montant=375,
        statut="pending",
        fedapay_transaction_id="9090",
    )

    class Resp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
            self.text = json.dumps(payload)

        def json(self):
            return self._payload

    def mock_get(url, headers=None, timeout=None):
        assert "/transactions/9090" in url
        return Resp(200, {"id": 9090, "status": "approved"})

    monkeypatch.setattr("requests.get", mock_get)

    first = api_client.post("/api/paiements/synchroniser/", {"transaction_id": "9090"}, format="json")
    assert first.status_code == 200
    assert first.data["activated"] is True
    assert first.data["credits_added"] == 15
    assert first.data["upload_credits"] == 15

    second = api_client.post("/api/paiements/synchroniser/", {"transaction_id": "9090"}, format="json")
    assert second.status_code == 200
    assert second.data["activated"] is True
    assert second.data["credits_added"] == 0
    assert second.data["upload_credits"] == 15

    user.refresh_from_db()
    assert user.upload_credits == 15


@pytest.mark.django_db
def test_guest_download_init_and_zip_flow(api_client, monkeypatch, settings, tmp_path):
    settings.FEDAPAY_API_KEY = "sk_sandbox_xxx"
    settings.FEDAPAY_ENV = "sandbox"
    settings.PUBLIC_FRONTEND_BASE_URL = "http://localhost"
    settings.MEDIA_ROOT = str(tmp_path)

    # Crée un user + event + un média approuvé dans album public
    from apps.accounts.models import User
    from apps.evenements.models import Album, Evenement, Media

    api_client.post(
        "/api/auth/register/",
        {"email": "g@example.com", "nom": "G", "password": "SuperSecret123"},
        format="json",
    )
    owner = User.objects.get(email="g@example.com")
    evt = Evenement.objects.create(user=owner, titre="E", date=timezone.now())
    album = Album.objects.create(evenement=evt, nom="Public", slug="public", is_public=True)
    m = Media.objects.create(evenement=evt, album=album, fichier="evenements/x.jpg", type="photo", approuve=True)

    # Mock FedaPay create transaction + inspect approved
    class Resp:
        def __init__(self, status_code, payload):
            self.status_code = status_code
            self._payload = payload
            self.text = json.dumps(payload)

        def json(self):
            return self._payload

    def mock_post(url, json=None, headers=None, timeout=None):
        if url.endswith("/transactions"):
            return Resp(201, {"id": 555, "status": "pending"})
        raise AssertionError(f"unexpected POST {url}")

    def mock_get(url, headers=None, timeout=None):
        if url.endswith("/transactions/555"):
            return Resp(200, {"id": 555, "status": "approved"})
        raise AssertionError(f"unexpected GET {url}")

    import requests

    monkeypatch.setattr(requests, "post", mock_post)
    monkeypatch.setattr(requests, "get", mock_get)

    # Init guest download
    res = api_client.post(
        "/api/paiements/invite/initier-telechargement/",
        {"media_ids": [m.id], "email": "invite@example.com"},
        format="json",
    )
    assert res.status_code == 200
    assert res.data["transaction_id"] == "555"

    # Mock storage open for zip write (file doesn't exist): create dummy file on disk
    import os

    os.makedirs(os.path.join(settings.MEDIA_ROOT, "evenements"), exist_ok=True)
    file_path = os.path.join(settings.MEDIA_ROOT, "evenements", "x.jpg")
    with open(file_path, "wb") as f:
        f.write(b"abc")
    # Update file field name to match
    m.fichier.name = "evenements/x.jpg"
    m.save(update_fields=["fichier"])

    zip_res = api_client.post("/api/paiements/invite/telecharger-zip/", {"transaction_id": "555"}, format="json")
    assert zip_res.status_code == 200
    assert zip_res.headers["Content-Type"].startswith("application/zip")

