"""Flux collecte FedaPay (API transactions).

1. POST /v1/transactions — description, amount (entier), currency, callback_url,
   customer (optionnel mais recommandé ; email unique), merchant_reference,
   custom_metadata.
2. Redirection : POST /v1/transactions/{id}/token pour obtenir l’URL hosted ; ou
   Checkout.js (sans token) avec la clé publique.
3. Le client paie ; callback_url reçoit id et status en query (indicatif seulement).
4. Toujours valider le statut réel via GET /v1/transactions/{id} ou webhook.
5. Webhook / synchroniser : même inspection `_fedapay_inspect_transaction`.
"""

import secrets
from datetime import timedelta

from django.conf import settings
from django.http import FileResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

import requests
from fedapay import WebhookSignature

from apps.evenements.models import Media

from .models import GuestDownloadPurchase, Paiement, PhotoTopUp, Plan
from .serializers import (
    InitierPaiementSerializer,
    PaiementSerializer,
    PlanSerializer,
    SynchroniserPaiementSerializer,
)
from .tasks import send_payment_confirmation_email


def _fedapay_customer_from_user(user) -> dict:
    """Customer FedaPay : prénom/nom + email (l’email sert de clé d’unicité côté FedaPay)."""
    parts = (getattr(user, "nom", None) or "").split()
    firstname = parts[0] if parts else "Client"
    lastname = " ".join(parts[1:]) if len(parts) > 1 else firstname
    return {"email": user.email, "firstname": firstname, "lastname": lastname}


def _fedapay_base_url() -> str:
    env = (settings.FEDAPAY_ENV or "sandbox").lower()
    return "https://api.fedapay.com/v1" if env == "live" else "https://sandbox-api.fedapay.com/v1"


def _fedapay_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.FEDAPAY_API_KEY}",
        "Content-Type": "application/json",
    }


def _unwrap_fedapay_resource(payload: dict) -> dict:
    """Normalise la réponse API (racine plate ou enveloppée v1 / data / transaction).

    Ne pas retourner un objet ``transaction`` vide ou sans id : FedaPay place parfois
    l'id sur le parent (v1 / data) alors que ``transaction`` est un stub — ce cas
    provoquait « id introuvable » malgré un corps JSON valide.
    """

    def _tx_meaningful(d: dict) -> bool:
        return bool(
            d.get("id") is not None
            or d.get("status") is not None
            or d.get("reference")
            or d.get("amount") is not None
        )

    if not isinstance(payload, dict):
        return {}

    # Certaines réponses utilisent une clé du type "v1/transaction": { ... }
    # (cf. Checkout.js / certains endpoints). On récupère directement l'objet interne.
    if len(payload) == 1:
        (only_key, only_val), *_ = payload.items()
        if isinstance(only_key, str) and "transaction" in only_key.lower() and isinstance(only_val, dict) and _tx_meaningful(only_val):
            return only_val
    for k, v in payload.items():
        if isinstance(k, str) and "transaction" in k.lower() and isinstance(v, dict) and _tx_meaningful(v):
            return v

    for key in ("v1", "data", "object"):
        inner = payload.get(key)
        if not isinstance(inner, dict):
            continue
        nested = inner.get("transaction")
        if isinstance(nested, dict) and _tx_meaningful(nested):
            return nested
        if inner.get("id") is not None or inner.get("status") is not None:
            return inner
    nested = payload.get("transaction")
    if isinstance(nested, dict) and _tx_meaningful(nested):
        return nested
    return payload


def _extract_payment_url(payload: dict) -> str | None:
    """
    FedaPay peut renvoyer l'URL de paiement à différents endroits selon la version:
    - payload["url"] / ["payment_url"] / ["invoice_url"] / ["redirect_url"]
    - payload["transaction"][...]
    - payload["data"][...]
    """

    def pick(d: dict) -> str | None:
        if not isinstance(d, dict):
            return None
        return d.get("url") or d.get("payment_url") or d.get("invoice_url") or d.get("redirect_url")

    return (
        pick(payload)
        or pick(payload.get("v1") or {})
        or pick(payload.get("transaction") or {})
        or pick(payload.get("data") or {})
        or pick((payload.get("data") or {}).get("transaction") or {})
    )


def _scan_fedapay_transaction_id(obj, depth: int = 0) -> str | None:
    """Dernier recours : id sur un noeud ``klass`` *transaction* (réponses FedaPay variables)."""
    if depth > 10:
        return None
    if isinstance(obj, dict):
        klass = obj.get("klass")
        if isinstance(klass, str) and "transaction" in klass.lower() and obj.get("id") is not None:
            return str(obj["id"])
        skip_keys = frozenset({"customer", "currency", "phone_number"})
        for k, v in obj.items():
            if k in skip_keys:
                continue
            found = _scan_fedapay_transaction_id(v, depth + 1)
            if found:
                return found
    elif isinstance(obj, list):
        for item in obj:
            found = _scan_fedapay_transaction_id(item, depth + 1)
            if found:
                return found
    return None


def _extract_tx_id(payload: dict) -> str | None:
    def pick(d: dict) -> str | None:
        if not isinstance(d, dict):
            return None
        v = d.get("id")
        if v is None:
            v = d.get("transaction_id")
        return str(v) if v is not None else None

    primary = (
        pick(payload)
        or pick(payload.get("v1") or {})
        or pick(payload.get("transaction") or {})
        or pick(payload.get("data") or {})
        or pick((payload.get("data") or {}).get("transaction") or {})
    )
    if primary:
        return primary
    return _scan_fedapay_transaction_id(payload)


def _extract_tx_status(payload: dict) -> str | None:
    def pick(d: dict) -> str | None:
        if not isinstance(d, dict):
            return None
        v = d.get("status")
        return str(v) if v is not None else None

    return (
        pick(payload)
        or pick(payload.get("v1") or {})
        or pick(payload.get("transaction") or {})
        or pick(payload.get("data") or {})
        or pick((payload.get("data") or {}).get("transaction") or {})
    )


def _fedapay_fetch_payment_url(tx_id: int) -> str | None:
    """
    Doc : POST /transactions/{id}/token renvoie {"url": "...", "token": "..."}.
    Voir https://docs.fedapay.com/api-reference/transactions/create-token
    """
    r = requests.post(
        f"{_fedapay_base_url()}/transactions/{int(tx_id)}/token",
        json={},
        headers=_fedapay_headers(),
        timeout=20,
    )
    if r.status_code not in (200, 201):
        return None
    body = r.json()
    unwrapped = _unwrap_fedapay_resource(body)
    return _extract_payment_url(unwrapped) or _extract_payment_url(body)


def _fedapay_inspect_transaction(tx_id: int) -> tuple[str | None, bool]:
    """
    Interroge GET /transactions/{id} et retourne (statut, paiement_réussi).

    Statuts collecte FedaPay (doc) : pending, approved, declined, canceled,
    refunded, transferred, expired.

    On active l’abonnement lorsque la collecte est *approved* (paiement réussi)
    ou *transferred* (fonds sur le compte marchand). En complément, on accepte
    ``approved_at`` / ``transferred_at`` si l’API renvoie encore ``pending`` en
    chaîne malgré un succès effectif.
    """
    try:
        r = requests.get(
            f"{_fedapay_base_url()}/transactions/{int(tx_id)}",
            headers=_fedapay_headers(),
            timeout=20,
        )
        if r.status_code != 200:
            return None, False
        raw = r.json()
        if not isinstance(raw, dict):
            return None, False
        tx = _unwrap_fedapay_resource(raw)
        st = _extract_tx_status(tx) if isinstance(tx, dict) else None
        if not st:
            st = _extract_tx_status(raw)
        st_norm = (st or "").strip().lower()

        # Succès explicites FedaPay (hors métadonnées de dates).
        success_statuses = frozenset({"approved", "transferred"})
        if st_norm in success_statuses:
            return st, True

        def _has_success_ts(d: object) -> bool:
            if not isinstance(d, dict):
                return False
            return bool(d.get("approved_at") or d.get("transferred_at"))

        if _has_success_ts(tx) or _has_success_ts(raw):
            return st or "approved", True

        for key in ("v1", "data"):
            inner = raw.get(key)
            if not isinstance(inner, dict):
                continue
            if _has_success_ts(inner):
                return st or "approved", True
            nested = inner.get("transaction")
            if isinstance(nested, dict) and _has_success_ts(nested):
                return st or "approved", True

        return st, False
    except Exception:
        return None, False


def _fedapay_get_transaction_raw(tx_id: int) -> dict | None:
    """Retourne le JSON brut de GET /transactions/{id} (pour debug)."""
    r = requests.get(
        f"{_fedapay_base_url()}/transactions/{int(tx_id)}",
        headers=_fedapay_headers(),
        timeout=20,
    )
    if r.status_code != 200:
        return None
    raw = r.json()
    return raw if isinstance(raw, dict) else None


def _activate_subscription_from_paiement(paiement: Paiement) -> None:
    """
    Active le plan sur l'utilisateur après paiement approuvé.
    N'envoie l'email de confirmation qu'au premier passage en approved.
    """
    user = paiement.user
    plan = paiement.plan
    notify = paiement.statut != "approved"
    months = int(getattr(paiement, "months_paid", 1) or 1)
    base = timezone.now()
    # Renouvellement : si l'utilisateur a déjà ce plan et qu'il n'est pas expiré, on prolonge.
    if getattr(user, "plan_actif_id", None) == plan.id and getattr(user, "expires_at", None) and user.expires_at > base:
        base = user.expires_at
    expires_at = base + timedelta(days=months * 30)
    user.plan_actif = plan
    user.expires_at = expires_at
    user.save(update_fields=["plan_actif", "expires_at"])
    paiement.expires_at = expires_at
    paiement.statut = "approved"
    paiement.save(update_fields=["expires_at", "statut"])
    if notify:
        send_payment_confirmation_email.delay(user.email, plan.nom, expires_at.isoformat())


class InitierPaiementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = InitierPaiementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = Plan.objects.get(pk=serializer.validated_data["plan_id"])
        months = int(serializer.validated_data.get("months") or 1)

        if not settings.FEDAPAY_API_KEY:
            return Response({"detail": "FEDAPAY_API_KEY manquant"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Callback côté navigateur (redirige après paiement).
        # FedaPay attend une URL valide: pas de placeholders type "{transaction_id}".
        callback_url = f"{settings.PUBLIC_FRONTEND_BASE_URL}/paiement/succes"
        merchant_reference = f"photoevent-u{request.user.id}-p{plan.id}-{secrets.token_hex(8)}"
        amount = int(plan.prix_xof) * months
        payload = {
            "description": f"Abonnement {plan.nom} ({months} mois)",
            "amount": amount,
            "currency": {"iso": "XOF"},
            "callback_url": callback_url,
            "customer": _fedapay_customer_from_user(request.user),
            "merchant_reference": merchant_reference,
            "custom_metadata": {
                "user_id": str(request.user.id),
                "plan_id": str(plan.id),
                "months": str(months),
            },
        }

        r = requests.post(f"{_fedapay_base_url()}/transactions", json=payload, headers=_fedapay_headers(), timeout=20)
        if r.status_code not in (200, 201):
            return Response({"detail": "FedaPay error", "fedapay": r.text}, status=status.HTTP_502_BAD_GATEWAY)
        tx_raw = r.json()
        if isinstance(tx_raw, list) and len(tx_raw) == 1:
            tx_raw = tx_raw[0]
        if not isinstance(tx_raw, dict):
            return Response(
                {"detail": "Réponse FedaPay inattendue (JSON non objet)", "fedapay": r.text[:4000] if r.text else tx_raw},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        tx = _unwrap_fedapay_resource(tx_raw)
        tx_id_str = _extract_tx_id(tx) or _extract_tx_id(tx_raw)
        tx_status = _extract_tx_status(tx) or _extract_tx_status(tx_raw) or "pending"
        pay_url = _extract_payment_url(tx) or _extract_payment_url(tx_raw)

        if not tx_id_str:
            return Response(
                {
                    "detail": "Réponse FedaPay inattendue (id de transaction introuvable)",
                    "fedapay": r.text[:4000] if r.text else tx_raw,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            tx_id_int = int(tx_id_str)
        except (TypeError, ValueError):
            return Response(
                {"detail": "ID de transaction FedaPay invalide", "transaction_id": tx_id_str},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        mode = serializer.validated_data.get("checkout_mode") or "redirect"

        # Redirection HTTP classique : récupérer l’URL hosted. Checkout.js n’en a pas besoin.
        if mode != "checkout_js":
            if not pay_url:
                pay_url = _fedapay_fetch_payment_url(tx_id_int)
            if not pay_url:
                try:
                    rr = requests.get(
                        f"{_fedapay_base_url()}/transactions/{tx_id_int}",
                        headers=_fedapay_headers(),
                        timeout=20,
                    )
                    if rr.status_code == 200:
                        got = _unwrap_fedapay_resource(rr.json())
                        pay_url = _extract_payment_url(got) or _extract_payment_url(rr.json())
                except Exception:
                    pay_url = None

        paiement = Paiement.objects.create(
            user=request.user,
            plan=plan,
            montant=amount,
            devise="XOF",
            statut=tx_status,
            fedapay_transaction_id=str(tx_id_int),
            months_paid=months,
        )

        if mode == "checkout_js":
            cust = _fedapay_customer_from_user(request.user)
            return Response(
                {
                    "payment_url": None,
                    "paiement_id": paiement.id,
                    "transaction_id": str(tx_id_int),
                    "checkout_mode": "checkout_js",
                    "customer": cust,
                }
            )

        if not pay_url:
            return Response(
                {
                    "detail": "Impossible d'obtenir l'URL de paiement FedaPay (endpoint /transactions/{id}/token)",
                    "paiement_id": paiement.id,
                    "transaction_id": paiement.fedapay_transaction_id,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"payment_url": pay_url, "paiement_id": paiement.id, "transaction_id": paiement.fedapay_transaction_id})


class WebhookPaiementView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # webhook public

    def post(self, request):
        payload = request.body.decode("utf-8") if isinstance(request.body, (bytes, bytearray)) else str(request.body)
        sig = request.headers.get("X-FEDAPAY-SIGNATURE") or request.headers.get("x-fedapay-signature")
        secret = settings.FEDAPAY_WEBHOOK_SECRET
        if secret:
            if not sig:
                return Response({"detail": "signature manquante"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                WebhookSignature.verify_header(payload, sig, secret, tolerance=300)
            except Exception:
                return Response({"detail": "signature invalide"}, status=status.HTTP_400_BAD_REQUEST)

        event = request.data if isinstance(request.data, dict) else {}

        # On cherche la transaction et son statut
        tx_id = None
        name = None
        name = event.get("name") or event.get("event") or event.get("type")
        tx_id = (
            event.get("data", {}).get("id")
            or event.get("data", {}).get("transaction", {}).get("id")
            or event.get("transaction", {}).get("id")
            or event.get("id")
        )

        if not tx_id:
            return Response({"detail": "transaction id manquant"}, status=status.HTTP_400_BAD_REQUEST)

        paiement = Paiement.objects.filter(fedapay_transaction_id=str(tx_id)).select_related("user", "plan").first()
        topup = None
        guest = None
        paiement_was_approved = bool(paiement and paiement.statut == "approved")
        topup_was_approved = False
        guest_was_approved = False
        if not paiement:
            topup = PhotoTopUp.objects.filter(fedapay_transaction_id=str(tx_id)).select_related("user").first()
            topup_was_approved = bool(topup and topup.statut == "approved")
            if not topup:
                guest = GuestDownloadPurchase.objects.filter(fedapay_transaction_id=str(tx_id)).first()
                guest_was_approved = bool(guest and guest.statut == "approved")
                if not guest:
                    # Rien à faire, mais répondre 2xx pour éviter retries infinies
                    return Response({"received": True})

        tx_status, payment_ok = _fedapay_inspect_transaction(int(tx_id))

        if paiement:
            if tx_status:
                paiement.statut = tx_status
                paiement.save(update_fields=["statut"])
        elif topup:
            if tx_status:
                topup.statut = tx_status
                topup.save(update_fields=["statut"])
        elif guest:
            if tx_status:
                guest.statut = tx_status
                guest.save(update_fields=["statut"])

        approved = payment_ok or (name == "transaction.approved") or (name == "transaction.transferred")
        if approved:
            if paiement:
                if not paiement_was_approved:
                    _activate_subscription_from_paiement(paiement)
            elif topup and not topup_was_approved:
                user = topup.user
                user.upload_credits = int(getattr(user, "upload_credits", 0) or 0) + int(topup.quantity)
                user.save(update_fields=["upload_credits"])
                topup.statut = "approved"
                topup.save(update_fields=["statut"])
            elif guest and not guest_was_approved:
                guest.statut = "approved"
                guest.save(update_fields=["statut"])

        return Response({"received": True})


class SynchroniserPaiementView(APIView):
    """
    GET /transactions/{id} côté serveur : source de vérité du statut (ne pas se fier
    au ``status`` passé dans callback_url). Active l’abonnement si approved / transferred
    ou horodatages approved_at / transferred_at. Utile quand le webhook n’est pas
    joignable (localhost) ou après retour navigateur sur ``/paiement/succes``.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SynchroniserPaiementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tx_id_raw = str(serializer.validated_data["transaction_id"]).strip()
        include_fedapay = bool(serializer.validated_data.get("include_fedapay"))

        paiement = (
            Paiement.objects.filter(user=request.user, fedapay_transaction_id=tx_id_raw)
            .select_related("plan", "user")
            .first()
        )
        topup = None
        guest = None
        if not paiement:
            topup = PhotoTopUp.objects.filter(user=request.user, fedapay_transaction_id=tx_id_raw).select_related("user").first()
            if not topup:
                return Response({"detail": "Paiement introuvable pour ce compte."}, status=status.HTTP_404_NOT_FOUND)
        paiement_was_approved = bool(paiement and paiement.statut == "approved")
        topup_was_approved = bool(topup and topup.statut == "approved")

        try:
            tx_id_int = int(tx_id_raw)
        except (TypeError, ValueError):
            return Response({"detail": "transaction_id invalide"}, status=status.HTTP_400_BAD_REQUEST)

        fedapay_raw = None
        fedapay_tx = None
        if include_fedapay:
            fedapay_raw = _fedapay_get_transaction_raw(tx_id_int)
            fedapay_tx = _unwrap_fedapay_resource(fedapay_raw) if isinstance(fedapay_raw, dict) else None

        tx_status, payment_ok = _fedapay_inspect_transaction(tx_id_int)
        if paiement and tx_status:
            paiement.statut = tx_status
            paiement.save(update_fields=["statut"])
        if topup and tx_status:
            topup.statut = tx_status
            topup.save(update_fields=["statut"])

        activated = False
        credits_added = 0
        if payment_ok:
            if paiement:
                if not paiement_was_approved:
                    _activate_subscription_from_paiement(paiement)
                activated = True
            elif topup:
                if not topup_was_approved:
                    request.user.upload_credits = int(getattr(request.user, "upload_credits", 0) or 0) + int(topup.quantity)
                    request.user.save(update_fields=["upload_credits"])
                    credits_added = int(topup.quantity)
                    topup.statut = "approved"
                    topup.save(update_fields=["statut"])
                # Succès de recharge confirmé (même si déjà créditée auparavant via webhook).
                activated = True

        request.user.refresh_from_db()
        plan_actif = request.user.get_effective_plan()
        resp = {
            "activated": activated,
            "statut": tx_status,
            "plan": plan_actif.nom if plan_actif else "Gratuit",
            "expires_at": request.user.expires_at.isoformat() if request.user.expires_at else None,
            "upload_credits": int(getattr(request.user, "upload_credits", 0) or 0),
            "credits_added": credits_added,
        }
        if include_fedapay:
            # Données de debug : réponse brute + objet normalisé utilisé par notre parsing.
            resp["fedapay_raw"] = fedapay_raw
            resp["fedapay_transaction"] = fedapay_tx
        return Response(resp)


class InitierRechargePhotosView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        quantity = int(request.data.get("quantity") or 0)
        if quantity <= 0 or quantity > 5000:
            return Response({"detail": "quantity invalide"}, status=status.HTTP_400_BAD_REQUEST)

        from apps.appconfig.models import AppConfig

        cfg = AppConfig.load()
        price = int(getattr(cfg, "topup_price_per_photo_xof", 25) or 25)
        amount = quantity * price

        callback_url = f"{settings.PUBLIC_FRONTEND_BASE_URL}/paiement/succes"
        merchant_reference = f"photoevent-u{request.user.id}-topup-{secrets.token_hex(8)}"
        payload = {
            "description": f"Recharge photos ({quantity})",
            "amount": int(amount),
            "currency": {"iso": "XOF"},
            "callback_url": callback_url,
            "customer": _fedapay_customer_from_user(request.user),
            "merchant_reference": merchant_reference,
            "custom_metadata": {
                "user_id": str(request.user.id),
                "type": "photo_topup",
                "quantity": str(quantity),
                "price_per_photo_xof": str(price),
            },
        }

        r = requests.post(f"{_fedapay_base_url()}/transactions", json=payload, headers=_fedapay_headers(), timeout=20)
        if r.status_code not in (200, 201):
            return Response({"detail": "FedaPay error", "fedapay": r.text}, status=status.HTTP_502_BAD_GATEWAY)
        tx_raw = r.json()
        if isinstance(tx_raw, list) and len(tx_raw) == 1:
            tx_raw = tx_raw[0]
        tx = _unwrap_fedapay_resource(tx_raw) if isinstance(tx_raw, dict) else {}
        tx_id_str = _extract_tx_id(tx) or _extract_tx_id(tx_raw if isinstance(tx_raw, dict) else {})
        if not tx_id_str:
            return Response({"detail": "Réponse FedaPay inattendue (id introuvable)"}, status=status.HTTP_502_BAD_GATEWAY)
        tx_id_int = int(tx_id_str)

        topup = PhotoTopUp.objects.create(
            user=request.user,
            quantity=quantity,
            price_per_photo_xof=price,
            montant=amount,
            statut=_extract_tx_status(tx) or _extract_tx_status(tx_raw if isinstance(tx_raw, dict) else {}) or "pending",
            fedapay_transaction_id=str(tx_id_int),
        )

        mode = request.data.get("checkout_mode") or "checkout_js"
        if mode == "checkout_js":
            cust = _fedapay_customer_from_user(request.user)
            return Response(
                {
                    "payment_url": None,
                    "topup_id": topup.id,
                    "transaction_id": str(tx_id_int),
                    "checkout_mode": "checkout_js",
                    "customer": cust,
                    "quantity": quantity,
                    "price_per_photo_xof": price,
                }
            )

        pay_url = _extract_payment_url(tx) or _extract_payment_url(tx_raw if isinstance(tx_raw, dict) else {}) or _fedapay_fetch_payment_url(tx_id_int)
        return Response(
            {
                "payment_url": pay_url,
                "topup_id": topup.id,
                "transaction_id": str(tx_id_int),
                "quantity": quantity,
                "price_per_photo_xof": price,
            }
        )


class InitierInviteTelechargementView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        media_ids = data.get("media_ids") or []
        if not isinstance(media_ids, list) or not media_ids:
            return Response({"detail": "media_ids requis"}, status=status.HTTP_400_BAD_REQUEST)
        media_ids = [int(x) for x in media_ids if str(x).isdigit()]
        media_ids = list(dict.fromkeys(media_ids))[:200]
        if not media_ids:
            return Response({"detail": "media_ids invalides"}, status=status.HTTP_400_BAD_REQUEST)

        email = str(data.get("email") or "").strip()[:254]

        from apps.appconfig.models import AppConfig
        from apps.evenements.models import Media

        # On ne vend que des médias approuvés du même événement (album public ou privé)
        qs = Media.objects.select_related("evenement", "album").filter(id__in=media_ids, approuve=True)
        found = list(qs)
        if len(found) != len(media_ids):
            return Response({"detail": "Certains médias sont introuvables ou non téléchargeables."}, status=status.HTTP_400_BAD_REQUEST)
        if len({m.evenement_id for m in found}) != 1:
            return Response({"detail": "Les photos doivent appartenir au même événement."}, status=status.HTTP_400_BAD_REQUEST)

        cfg = AppConfig.load()
        price = int(getattr(cfg, "guest_download_price_per_photo_xof", 25) or 25)
        amount = len(found) * price

        # Politique de paiement du téléchargement invité pilotée globalement (AppConfig).
        payment_required = bool(getattr(cfg, "guest_download_payment_required", True))

        if not payment_required:
            free_tx_id = f"FREE-{secrets.token_hex(10)}"
            GuestDownloadPurchase.objects.create(
                user_email=email,
                media_ids=media_ids,
                montant=0,
                price_per_photo_xof=0,
                statut="approved",
                fedapay_transaction_id=free_tx_id,
            )
            return Response(
                {
                    "transaction_id": free_tx_id,
                    "amount": 0,
                    "count": len(found),
                    "price_per_photo_xof": 0,
                    "customer": {"email": email, "firstname": "Invite", "lastname": "PhotoEvent"},
                    "checkout_mode": "free_download",
                }
            )

        callback_url = f"{settings.PUBLIC_FRONTEND_BASE_URL}/paiement/succes"
        merchant_reference = f"photoevent-guest-dl-{secrets.token_hex(8)}"
        payload = {
            "description": f"Téléchargement ({len(found)} photo(s))",
            "amount": int(amount),
            "currency": {"iso": "XOF"},
            "callback_url": callback_url,
            "customer": {
                "email": email or f"guest-{secrets.token_hex(4)}@example.com",
                "firstname": "Invite",
                "lastname": "PhotoEvent",
            },
            "merchant_reference": merchant_reference,
            "custom_metadata": {
                "type": "guest_download",
                "count": str(len(found)),
            },
        }

        r = requests.post(f"{_fedapay_base_url()}/transactions", json=payload, headers=_fedapay_headers(), timeout=20)
        if r.status_code not in (200, 201):
            return Response({"detail": "FedaPay error", "fedapay": r.text}, status=status.HTTP_502_BAD_GATEWAY)
        tx_raw = r.json()
        if isinstance(tx_raw, list) and len(tx_raw) == 1:
            tx_raw = tx_raw[0]
        if not isinstance(tx_raw, dict):
            return Response({"detail": "Réponse FedaPay inattendue"}, status=status.HTTP_502_BAD_GATEWAY)
        tx = _unwrap_fedapay_resource(tx_raw)
        tx_id_str = _extract_tx_id(tx) or _extract_tx_id(tx_raw)
        if not tx_id_str:
            return Response({"detail": "Réponse FedaPay inattendue (id introuvable)"}, status=status.HTTP_502_BAD_GATEWAY)
        tx_id_int = int(tx_id_str)

        GuestDownloadPurchase.objects.create(
            user_email=email,
            media_ids=media_ids,
            montant=amount,
            price_per_photo_xof=price,
            statut=_extract_tx_status(tx) or _extract_tx_status(tx_raw) or "pending",
            fedapay_transaction_id=str(tx_id_int),
        )

        return Response(
            {
                "transaction_id": str(tx_id_int),
                "amount": amount,
                "count": len(found),
                "price_per_photo_xof": price,
                "customer": {"email": email, "firstname": "Invite", "lastname": "PhotoEvent"},
                "checkout_mode": "checkout_js",
            }
        )


class InviteTelechargementZipView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        tx_id_raw = str(data.get("transaction_id") or "").strip()
        if not tx_id_raw:
            return Response({"detail": "transaction_id requis"}, status=status.HTTP_400_BAD_REQUEST)

        purchase = GuestDownloadPurchase.objects.filter(fedapay_transaction_id=tx_id_raw).first()
        if not purchase:
            return Response({"detail": "Achat introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if purchase.used_at is not None:
            return Response({"detail": "Ce paiement a déjà été utilisé."}, status=status.HTTP_409_CONFLICT)

        # Cas gratuit : pas de transaction FedaPay, téléchargement direct autorisé.
        if purchase.montant > 0:
            if not tx_id_raw.isdigit():
                return Response({"detail": "transaction_id invalide"}, status=status.HTTP_400_BAD_REQUEST)
            tx_status, payment_ok = _fedapay_inspect_transaction(int(tx_id_raw))
            if not payment_ok:
                return Response({"detail": "Paiement non confirmé.", "statut": tx_status}, status=status.HTTP_402_PAYMENT_REQUIRED)

        from django.utils import timezone as dj_tz
        from apps.evenements.models import Media
        from apps.evenements.zip_tasks import generate_selected_media_zip

        medias = list(Media.objects.filter(id__in=list(purchase.media_ids), approuve=True))
        if not medias:
            return Response({"detail": "Aucun média."}, status=status.HTTP_400_BAD_REQUEST)

        out_path = generate_selected_media_zip(slug=f"tx-{tx_id_raw}", medias=medias)
        purchase.used_at = dj_tz.now()
        purchase.statut = "approved"
        purchase.save(update_fields=["used_at", "statut"])
        return FileResponse(open(out_path, "rb"), content_type="application/zip")


class HistoriquePaiementsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Paiement.objects.filter(user=request.user).select_related("plan").order_by("-created_at")
        return Response(PaiementSerializer(qs, many=True).data)


class UsageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        plan = request.user.get_effective_plan()
        uploads_used = Media.objects.filter(evenement__user=request.user).count()
        uploads_max = plan.nb_uploads_max if plan else 50
        from apps.evenements.models import Evenement

        evenements_used = Evenement.objects.filter(user=request.user).count()
        evenements_max = plan.nb_evenements_max if plan else 1
        albums_per_event_max = plan.nb_albums_max if plan else 2
        return Response(
            {
                "plan": plan.nom if plan else "Gratuit",
                "uploads_used": uploads_used,
                "uploads_max": uploads_max,
                "evenements_used": evenements_used,
                "evenements_max": evenements_max,
                "albums_per_event_max": albums_per_event_max,
                "upload_credits": int(getattr(request.user, "upload_credits", 0) or 0),
                "expires_at": request.user.expires_at.isoformat() if request.user.expires_at else None,
            }
        )


class PlansPublicView(APIView):
    """
    Liste publique des plans d'abonnement.
    Utilisé par le frontend (pricing / dashboard) pour afficher les offres.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        qs = Plan.objects.all().order_by("prix_xof", "id")
        return Response(PlanSerializer(qs, many=True).data)

