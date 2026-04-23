from datetime import datetime, timedelta
from datetime import time as dt_time

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.http import FileResponse, Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.core.cache import cache
from django_ratelimit.decorators import ratelimit
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework import generics, permissions, status
from rest_framework.exceptions import APIException
from rest_framework.views import APIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .codes import is_valid_public_code, normalize_public_code
from .models import Album, AlbumQRCode, Evenement, Media, MediaFaceEncoding
from .permissions import IsOwner
from .serializers import (
    AlbumSerializer,
    EvenementSerializer,
    MediaSerializer,
    PublicAlbumMediaSerializer,
)
from .services import build_photowall_qr_bytes, build_qr_png_bytes, make_qr_content_file
from .tasks import notify_organizer_guest_quota_blocked, process_photo
from .zip_tasks import generate_event_zip
from .face_tools import cosine_similarity, extract_face_embedding


ALLOWED_UPLOAD_MIME = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "video/mp4",
    "video/quicktime",
}

MAX_IMAGE_BYTES = 20 * 1024 * 1024
MAX_VIDEO_BYTES = 500 * 1024 * 1024


class PaymentRequired(APIException):
    status_code = 402
    default_detail = "Abonnement requis."
    default_code = "payment_required"


def _album_cache_key(slug: str, album_slug: str, page: int, *, section: str | None = None) -> str:
    v = cache.get(_album_version_key(slug), 1)
    if section:
        return f"album:{slug}:{album_slug}:sec:{section}:v{v}:page:{page}"
    return f"album:{slug}:{album_slug}:v{v}:page:{page}"


def _album_split_meta_cache_key(slug: str, album_slug: str) -> str:
    v = cache.get(_album_version_key(slug), 1)
    return f"album:{slug}:{album_slug}:split-meta:v{v}"


def _album_version_key(slug: str) -> str:
    return f"album:{slug}:version"


def _invalidate_album_cache(slug: str) -> None:
    key = _album_version_key(slug)
    try:
        cache.incr(key)
    except Exception:
        # incr peut échouer si la clé n'existe pas selon backend → on la réinitialise
        current = cache.get(key, 1)
        cache.set(key, int(current) + 1, timeout=None)


class EvenementListCreateView(generics.ListCreateAPIView):
    serializer_class = EvenementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Evenement.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        # Quota événements selon plan actif
        plan = self.request.user.get_effective_plan()
        events_max = getattr(plan, "nb_evenements_max", 1) if plan else 1
        if events_max != -1:
            used = Evenement.objects.filter(user=self.request.user).count()
            if used >= int(events_max):
                raise PaymentRequired("Quota événements atteint pour ce plan.")

        evt: Evenement = serializer.save(user=self.request.user)

        # Album par défaut "Public" (reçoit un public_code unique)
        album = Album(evenement=evt, nom="Public", slug="public", is_public=True)
        album.save()

        # Le QR invité est celui de l'album public (généré à la demande par l'endpoint album QR).


class EvenementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EvenementSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    lookup_field = "slug"

    def get_queryset(self):
        return Evenement.objects.select_related("user").all()


def _response_single_public_album_only() -> Response:
    return Response(
        {
            "detail": "Un seul album public par événement : l’album « Public » existe déjà. Crée des albums privés pour le reste.",
            "code": "SINGLE_PUBLIC_ALBUM_ONLY",
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


def _public_evenement_album_block(evt: Evenement, album: Album) -> dict:
    return {
        "titre": evt.titre,
        "slug": evt.slug,
        "public_code": evt.public_code,
        "album": {
            "nom": album.nom,
            "slug": album.slug,
            "public_code": album.public_code,
            "is_public": album.is_public,
            "guest_upload_enabled": album.guest_upload_enabled,
        },
        "date": evt.date,
        "description": evt.description,
        "couleur_theme": evt.couleur_theme,
        "actif": evt.actif,
        "qrcode_url": f"/api/evenements/{evt.slug}/albums/public/qrcode/",
    }


def _public_album_list_response(request, evt: Evenement, album: Album, *, view_for_pagination):
    page = int(request.query_params.get("page", "1") or "1")
    galerie_split = not album.is_public
    section_raw = (request.query_params.get("section") or "").strip().lower()
    section = section_raw if section_raw in ("public", "private") else None

    if galerie_split:
        if section is None:
            if page != 1:
                return Response(
                    {"detail": "Paramètre section=public|private requis pour la pagination d’un album privé."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            meta_key = _album_split_meta_cache_key(evt.slug, album.slug)
            cached_meta = cache.get(meta_key)
            if cached_meta:
                return Response(cached_meta)
            pub_c = evt.medias.filter(approuve=True, album__is_public=True).count()
            priv_c = evt.medias.filter(approuve=True, album=album).count()
            payload = {
                "evenement": _public_evenement_album_block(evt, album),
                "galerie_split": True,
                "section": None,
                "section_counts": {"public": pub_c, "private": priv_c},
                "medias": [],
                "pagination": {
                    "count": 0,
                    "next": None,
                    "previous": None,
                    "page_size": 20,
                },
            }
            cache.set(meta_key, payload, timeout=30)
            return Response(payload)

        cache_key = _album_cache_key(evt.slug, album.slug, page, section=section)
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        if section == "public":
            medias_qs = evt.medias.filter(approuve=True, album__is_public=True).order_by("-created_at")
        else:
            medias_qs = evt.medias.filter(approuve=True, album=album).order_by("-created_at")
    else:
        cache_key = _album_cache_key(evt.slug, album.slug, page)
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        medias_qs = evt.medias.filter(approuve=True, album=album).order_by("-created_at")

    paginator = PageNumberPagination()
    paginator.page_size = 20
    paged = paginator.paginate_queryset(medias_qs, request, view=view_for_pagination)
    medias_data = PublicAlbumMediaSerializer(paged, many=True, context={"request": request}).data
    payload = {
        "evenement": _public_evenement_album_block(evt, album),
        "galerie_split": galerie_split,
        "section": section if galerie_split else None,
        "pagination": {
            "count": paginator.page.paginator.count,
            "next": paginator.get_next_link(),
            "previous": paginator.get_previous_link(),
            "page_size": paginator.page_size,
        },
        "medias": medias_data,
    }
    cache.set(cache_key, payload, timeout=30)
    return Response(payload)


class PublicAlbumView(generics.ListAPIView):
    serializer_class = PublicAlbumMediaSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        evt = get_object_or_404(Evenement, slug=kwargs["slug"], actif=True)
        album_slug = kwargs.get("album_slug") or "public"
        album = get_object_or_404(Album, evenement=evt, slug=album_slug)
        return _public_album_list_response(request, evt, album, view_for_pagination=self)


class PublicAlbumByCodesView(generics.ListAPIView):
    """Album public résolu par codes courts QR (public_code événement + album)."""

    serializer_class = PublicAlbumMediaSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        ec = normalize_public_code(kwargs["event_code"])
        ac = normalize_public_code(kwargs["album_code"])
        if not is_valid_public_code(ec) or not is_valid_public_code(ac):
            return Response(status=status.HTTP_404_NOT_FOUND)
        evt = get_object_or_404(Evenement, public_code=ec, actif=True)
        album = get_object_or_404(Album, evenement=evt, public_code=ac)
        return _public_album_list_response(request, evt, album, view_for_pagination=self)


def _album_face_search_media_qs(evt: Evenement, album: Album):
    if album.is_public:
        return evt.medias.filter(approuve=True, album=album)
    return evt.medias.filter(approuve=True).filter(Q(album=album) | Q(album__is_public=True))


def _index_missing_face_encodings(media_qs, limit: int = 120) -> None:
    media_ids = list(media_qs.values_list("id", flat=True))
    if not media_ids:
        return
    existing = set(MediaFaceEncoding.objects.filter(media_id__in=media_ids).values_list("media_id", flat=True))
    missing_ids = [mid for mid in media_ids if mid not in existing][:limit]
    if not missing_ids:
        return
    photos = Media.objects.filter(id__in=missing_ids, type=Media.MediaType.PHOTO).only("id", "fichier")
    for media in photos:
        try:
            media.fichier.open("rb")
            payload = media.fichier.read()
        except Exception:
            continue
        finally:
            try:
                media.fichier.close()
            except Exception:
                pass
        face_data = extract_face_embedding(payload)
        if face_data is None:
            continue
        emb, quality = face_data
        MediaFaceEncoding.objects.update_or_create(
            media=media,
            defaults={
                "embedding": emb,
                "embedding_dim": len(emb),
                "quality_score": quality,
            },
        )


@method_decorator(ratelimit(key="ip", rate="10/m", method="POST", block=True), name="dispatch")
class PublicAlbumFaceSearchByCodesView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, event_code: str, album_code: str):
        ec = normalize_public_code(event_code)
        ac = normalize_public_code(album_code)
        if not is_valid_public_code(ec) or not is_valid_public_code(ac):
            return Response(status=status.HTTP_404_NOT_FOUND)

        evt = get_object_or_404(Evenement, public_code=ec, actif=True)
        album = get_object_or_404(Album, evenement=evt, public_code=ac)

        selfie = request.FILES.get("selfie")
        if not selfie:
            return Response({"detail": "selfie requis"}, status=status.HTTP_400_BAD_REQUEST)
        if not str(getattr(selfie, "content_type", "")).lower().startswith("image/"):
            return Response({"detail": "Le selfie doit être une image."}, status=status.HTTP_400_BAD_REQUEST)
        if getattr(selfie, "size", 0) > 10 * 1024 * 1024:
            return Response({"detail": "Selfie trop volumineux (max 10Mo)."}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        raw = selfie.read()
        selfie_face = extract_face_embedding(raw)
        if selfie_face is None:
            return Response(
                {"detail": "Aucun visage détecté. Essaie une photo plus nette, bien éclairée et de face."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        selfie_embedding, _ = selfie_face

        try:
            threshold = float(request.data.get("threshold", 0.92))
        except Exception:
            threshold = 0.92
        threshold = min(max(threshold, 0.75), 0.99)

        media_qs = _album_face_search_media_qs(evt, album)
        # Backfill opportuniste pour les anciens uploads non indexés.
        _index_missing_face_encodings(media_qs)
        encodings = (
            MediaFaceEncoding.objects.select_related("media")
            .filter(media__in=media_qs)
            .exclude(embedding=[])
        )

        matches = []
        for row in encodings:
            score = cosine_similarity(selfie_embedding, row.embedding or [])
            if score >= threshold:
                matches.append({"media_id": row.media_id, "score": round(score, 4)})

        matches.sort(key=lambda item: item["score"], reverse=True)
        return Response(
            {
                "matches": matches[:500],
                "match_count": len(matches),
                "indexed_count": encodings.count(),
                "threshold": threshold,
            }
        )


class EvenementAlbumsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug: str):
        evt = get_object_or_404(Evenement.objects.select_related("user"), slug=slug)
        if evt.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        from django.db.models import Count

        albums = evt.albums.annotate(medias_count=Count("medias")).order_by("created_at")
        return Response(AlbumSerializer(albums, many=True).data)

    def post(self, request, slug: str):
        evt = get_object_or_404(Evenement.objects.select_related("user"), slug=slug)
        if evt.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        # Quota albums par événement (1 public + privés) — voir Plan.nb_albums_max et UsageView.albums_per_event_max.
        plan = request.user.get_effective_plan()
        albums_max = plan.nb_albums_max if plan else 2
        if albums_max != -1:
            used = evt.albums.count()
            if used >= int(albums_max):
                return Response({"detail": "Quota albums atteint pour ce plan."}, status=status.HTTP_402_PAYMENT_REQUIRED)

        ser = AlbumSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        want_public = bool(ser.validated_data.get("is_public", False))
        if want_public and evt.albums.filter(is_public=True).exists():
            return _response_single_public_album_only()
        album = Album.objects.create(
            evenement=evt,
            nom=ser.validated_data["nom"],
            is_public=want_public,
            slug="",  # généré via save
        )
        album.save()
        return Response(AlbumSerializer(album).data, status=status.HTTP_201_CREATED)


class EvenementAlbumDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, slug: str, album_slug: str):
        evt = get_object_or_404(Evenement.objects.select_related("user"), slug=slug)
        if evt.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        album = get_object_or_404(Album, evenement=evt, slug=album_slug)
        if album.slug == "public":
            return Response(
                {
                    "detail": "L’album « Public » est obligatoire et ne peut pas être supprimé.",
                    "code": "CANNOT_DELETE_DEFAULT_PUBLIC_ALBUM",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        album.delete()
        _invalidate_album_cache(evt.slug)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, slug: str, album_slug: str):
        evt = get_object_or_404(Evenement.objects.select_related("user"), slug=slug)
        if evt.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        album = get_object_or_404(Album, evenement=evt, slug=album_slug)
        data = request.data if isinstance(request.data, dict) else {}
        update_fields: list[str] = []
        if "nom" in data:
            album.nom = str(data.get("nom") or "").strip()[:120] or album.nom
            update_fields.append("nom")
        if "is_public" in data:
            want_public = bool(data.get("is_public"))
            if want_public and evt.albums.filter(is_public=True).exclude(pk=album.pk).exists():
                return _response_single_public_album_only()
            album.is_public = want_public
            update_fields.append("is_public")
        if "guest_upload_enabled" in data:
            album.guest_upload_enabled = bool(data.get("guest_upload_enabled"))
            update_fields.append("guest_upload_enabled")
        if update_fields:
            album.save(update_fields=update_fields)
            _invalidate_album_cache(evt.slug)
        return Response(AlbumSerializer(album).data)


def _album_qr_png_response(album: Album):
    evt = album.evenement
    target = album.public_url
    qr, created = AlbumQRCode.objects.get_or_create(album=album, defaults={"url_cible": target})
    need_image = created or not qr.image_path or (qr.url_cible != target)
    qr.url_cible = target
    qr.save(update_fields=["url_cible"])
    if need_image:
        qr_file = make_qr_content_file(qr.url_cible, filename=f"{evt.slug}-{album.slug}.png")
        qr.image_path.save(qr_file.name, qr_file, save=True)
    return FileResponse(qr.image_path.open("rb"), content_type="image/png")


def _album_upload_qr_png_response(album: Album):
    png = build_qr_png_bytes(album.upload_url, fill_color="#111111")
    return HttpResponse(png, content_type="image/png")


class AlbumQRCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str, album_slug: str):
        evt = get_object_or_404(Evenement, slug=slug)
        album = get_object_or_404(Album, evenement=evt, slug=album_slug)
        return _album_qr_png_response(album)


class AlbumUploadQRCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str, album_slug: str):
        evt = get_object_or_404(Evenement, slug=slug)
        album = get_object_or_404(Album, evenement=evt, slug=album_slug)
        return _album_upload_qr_png_response(album)


class AlbumQRCodeByCodesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, event_code: str, album_code: str):
        ec = normalize_public_code(event_code)
        ac = normalize_public_code(album_code)
        if not is_valid_public_code(ec) or not is_valid_public_code(ac):
            raise Http404
        evt = get_object_or_404(Evenement, public_code=ec)
        album = get_object_or_404(Album, evenement=evt, public_code=ac)
        return _album_qr_png_response(album)


class AlbumUploadQRCodeByCodesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, event_code: str, album_code: str):
        ec = normalize_public_code(event_code)
        ac = normalize_public_code(album_code)
        if not is_valid_public_code(ec) or not is_valid_public_code(ac):
            raise Http404
        evt = get_object_or_404(Evenement, public_code=ec)
        album = get_object_or_404(Album, evenement=evt, public_code=ac)
        return _album_upload_qr_png_response(album)


@method_decorator(ratelimit(key="ip", rate="10/m", method="POST", block=True), name="dispatch")
class EvenementMediaView(APIView):
    """
    - GET : liste des médias (owner only)
    - POST : upload invité (public) avec rate limit + compression Celery
    """

    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, slug: str):
        evt = get_object_or_404(Evenement.objects.select_related("user"), slug=slug)
        if evt.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        medias = evt.medias.order_by("-created_at")
        return Response(MediaSerializer(medias, many=True, context={"request": request}).data)

    def post(self, request, slug: str):
        evt = get_object_or_404(Evenement, slug=slug, actif=True)
        album_slug = str(request.query_params.get("album") or "public").strip() or "public"
        album = get_object_or_404(Album, evenement=evt, slug=album_slug)
        if bool(getattr(request.user, "is_authenticated", False)) and evt.user_id == request.user.id:
            return _post_owner_medias_batch(request, evt, album)
        return _post_guest_media(request, evt, album)


def _guest_quota_blocked_payload(evt: Evenement, album: Album) -> dict:
    owner = evt.user
    return {
        "detail": "Le nombre maximum de photos pour cet événement est atteint. Contactez l’organisateur ou réessayez plus tard.",
        "code": "GUEST_QUOTA_FULL",
        "organizer": {
            "nom": (getattr(owner, "nom", None) or "").strip(),
            "email": getattr(owner, "email", "") or "",
        },
        "evenement": {
            "titre": evt.titre,
            "public_code": evt.public_code,
        },
        "album": {"nom": album.nom, "public_code": album.public_code},
    }


def _maybe_notify_organizer_quota_blocked(evt: Evenement, album: Album) -> None:
    """Max 1 e-mail / événement toutes les 6 h pour limiter le spam."""
    cache_key = f"guest_quota_notify_evt:{evt.id}"
    if cache.get(cache_key):
        return
    owner = evt.user
    notify_organizer_guest_quota_blocked.delay(
        organizer_email=getattr(owner, "email", "") or "",
        organizer_name=(getattr(owner, "nom", None) or "").strip(),
        event_title=evt.titre,
        event_public_code=evt.public_code or "",
        album_nom=album.nom,
    )
    cache.set(cache_key, 1, timeout=6 * 3600)


def _post_guest_media(request, evt: Evenement, album: Album):
    if not album.guest_upload_enabled:
        return Response(
            {
                "detail": "L’organisateur a désactivé les envois sur cet album pour le moment.",
                "code": "GUEST_UPLOAD_DISABLED",
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    # Quota uploads selon plan actif
    plan = evt.user.get_effective_plan()
    uploads_max = getattr(plan, "nb_uploads_max", 50) if plan else 50
    if uploads_max != -1:
        used = evt.medias.count()
        if used >= int(uploads_max):
            # Crédit photos (recharge) : débloque un upload supplémentaire.
            if getattr(evt.user, "upload_credits", 0) > 0:
                evt.user.upload_credits = int(evt.user.upload_credits) - 1
                evt.user.save(update_fields=["upload_credits"])
            else:
                _maybe_notify_organizer_quota_blocked(evt, album)
                return Response(_guest_quota_blocked_payload(evt, album), status=status.HTTP_402_PAYMENT_REQUIRED)
    f = request.FILES.get("fichier")
    if not f:
        return Response({"detail": "fichier requis"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        media_type = _validate_media_upload_file(f)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except OverflowError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

    # Règle métier demandée : tous les uploads invités sont approuvés automatiquement.
    approuve = True

    media = Media.objects.create(
        evenement=evt,
        album=album,
        fichier=f,
        type=media_type,
        legende=request.data.get("legende", "")[:255],
        approuve=approuve,
        uploaded_by_ip=request.META.get("REMOTE_ADDR"),
    )

    if media.type == Media.MediaType.PHOTO:
        process_photo.delay(media.id)

    # PhotoWall : broadcast temps réel seulement si approuvé
    if media.approuve:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"photowall_{evt.slug}",
            {
                "type": "new_media",
                "media": {
                    "id": media.id,
                    "url": request.build_absolute_uri(media.fichier.url),
                    "type": media.type,
                    "legende": media.legende,
                    "created_at": media.created_at.isoformat(),
                },
            },
        )

        _invalidate_album_cache(evt.slug)

    return Response(MediaSerializer(media, context={"request": request}).data, status=status.HTTP_201_CREATED)


def _validate_media_upload_file(f) -> str:
    content_type = (getattr(f, "content_type", "") or "").lower()
    if content_type not in ALLOWED_UPLOAD_MIME:
        raise ValueError("MIME non supporté")
    if content_type.startswith("image/"):
        if getattr(f, "size", 0) > MAX_IMAGE_BYTES:
            raise OverflowError("Image trop volumineuse (max 20Mo).")
        return Media.MediaType.PHOTO
    if getattr(f, "size", 0) > MAX_VIDEO_BYTES:
        raise OverflowError("Vidéo trop volumineuse (max 500Mo).")
    return Media.MediaType.VIDEO


def _post_owner_medias_batch(request, evt: Evenement, album: Album):
    files = request.FILES.getlist("fichiers")
    if not files:
        single = request.FILES.get("fichier")
        if single:
            files = [single]
    if not files:
        return Response({"detail": "Aucun fichier reçu."}, status=status.HTTP_400_BAD_REQUEST)
    if len(files) > 100:
        return Response({"detail": "Maximum 100 fichiers par envoi."}, status=status.HTTP_400_BAD_REQUEST)

    legend = str(request.data.get("legende", "") or "")[:255]
    created_media: list[Media] = []
    errors: list[dict] = []

    for f in files:
        try:
            media_type = _validate_media_upload_file(f)
            media = Media.objects.create(
                evenement=evt,
                album=album,
                fichier=f,
                type=media_type,
                legende=legend,
                approuve=True,
                uploaded_by_ip=request.META.get("REMOTE_ADDR"),
            )
            if media.type == Media.MediaType.PHOTO:
                process_photo.delay(media.id)

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"photowall_{evt.slug}",
                {
                    "type": "new_media",
                    "media": {
                        "id": media.id,
                        "url": request.build_absolute_uri(media.fichier.url),
                        "type": media.type,
                        "legende": media.legende,
                        "created_at": media.created_at.isoformat(),
                    },
                },
            )
            created_media.append(media)
        except OverflowError as exc:
            errors.append({"name": getattr(f, "name", "fichier"), "detail": str(exc)})
        except ValueError as exc:
            errors.append({"name": getattr(f, "name", "fichier"), "detail": str(exc)})

    if created_media:
        _invalidate_album_cache(evt.slug)

    payload = {
        "uploaded": len(created_media),
        "failed": errors,
        "album": album.slug,
        "created": MediaSerializer(created_media, many=True, context={"request": request}).data,
    }
    if not created_media:
        return Response(payload, status=status.HTTP_400_BAD_REQUEST)
    return Response(payload, status=status.HTTP_201_CREATED)


@method_decorator(ratelimit(key="ip", rate="10/m", method="POST", block=True), name="dispatch")
class EvenementMediaByCodesView(APIView):
    """Upload invité ciblé par codes QR (sans connaître le slug)."""

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.AllowAny]

    def post(self, request, event_code: str, album_code: str):
        ec = normalize_public_code(event_code)
        ac = normalize_public_code(album_code)
        if not is_valid_public_code(ec) or not is_valid_public_code(ac):
            return Response(status=status.HTTP_404_NOT_FOUND)
        evt = get_object_or_404(Evenement, public_code=ec, actif=True)
        album = get_object_or_404(Album, evenement=evt, public_code=ac)
        return _post_guest_media(request, evt, album)


class MediaApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk: int):
        media = get_object_or_404(Media.objects.select_related("evenement", "evenement__user"), pk=pk)
        if media.evenement.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        approved = request.data.get("approved", None)
        if approved is None:
            return Response({"detail": "approved requis (true/false)"}, status=status.HTTP_400_BAD_REQUEST)

        approved_bool = bool(approved)
        media.approuve = approved_bool
        media.save(update_fields=["approuve"])

        _invalidate_album_cache(media.evenement.slug)

        if approved_bool:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"photowall_{media.evenement.slug}",
                {
                    "type": "new_media",
                    "media": {
                        "id": media.id,
                        "url": request.build_absolute_uri(media.fichier.url),
                        "type": media.type,
                        "legende": media.legende,
                        "created_at": media.created_at.isoformat(),
                    },
                },
            )

        return Response(MediaSerializer(media, context={"request": request}).data, status=status.HTTP_200_OK)


class MediaDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Media.objects.select_related("evenement", "evenement__user")

    def destroy(self, request, *args, **kwargs):
        media = self.get_object()
        if media.evenement.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class EvenementQRCodeView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        evt = get_object_or_404(Evenement, slug=slug)
        album = get_object_or_404(Album, evenement=evt, slug="public")
        # Compat historique: /qrcode/ continue d'exister, mais renvoie le QR du public.
        return _album_qr_png_response(album)


class EvenementPhotoWallQRCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        code = normalize_public_code(slug)
        evt = get_object_or_404(
            Evenement.objects.filter(Q(slug=slug) | Q(public_code=code))
        )
        url = f"{request.scheme}://{request.get_host()}/photowall/{evt.public_code or evt.slug}"
        png = build_photowall_qr_bytes(url)
        return HttpResponse(png, content_type="image/png")


class EvenementPhotoWallPlaylistView(APIView):
    """Tous les médias approuvés de l’événement (tous albums) pour le diaporama Photowall."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        code = normalize_public_code(slug)
        evt = get_object_or_404(
            Evenement.objects.filter(actif=True).filter(Q(slug=slug) | Q(public_code=code))
        )
        medias_qs = evt.medias.filter(approuve=True).order_by("-created_at")
        cap = 2000
        medias = list(medias_qs[:cap])
        data = PublicAlbumMediaSerializer(medias, many=True, context={"request": request}).data
        qrcode_path = reverse("evenements-album-qrcode-upload", kwargs={"slug": evt.slug, "album_slug": "public"})
        qrcode_url = request.build_absolute_uri(qrcode_path)
        return Response(
            {
                "evenement": {
                    "titre": evt.titre,
                    "slug": evt.slug,
                    "public_code": evt.public_code,
                    "qrcode_url": qrcode_url,
                },
                "medias": data,
            }
        )


class EvenementDownloadZipView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug: str):
        evt = get_object_or_404(Evenement.objects.select_related("user"), slug=slug)
        if evt.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        # Génération async (si déjà fait, on sert l'existant)
        path = generate_event_zip(evt.id)
        return FileResponse(open(path, "rb"), content_type="application/zip")


class OrganizerDashboardStatsView(APIView):
    """Stats agrégées pour le tableau de bord organisateur (graphiques + métriques)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        medias_qs = Media.objects.filter(evenement__user=user)
        albums_total = Album.objects.filter(evenement__user=user).count()
        medias_photo = medias_qs.filter(type=Media.MediaType.PHOTO).count()
        medias_video = medias_qs.filter(type=Media.MediaType.VIDEO).count()
        guest_contributions = medias_qs.filter(uploaded_by_ip__isnull=False).exclude(uploaded_by_ip="").count()
        pending_moderation = medias_qs.filter(approuve=False).count()

        storage_bytes = 0
        for m in medias_qs.exclude(fichier="").iterator(chunk_size=300):
            try:
                storage_bytes += m.fichier.size
            except (OSError, ValueError, FileNotFoundError):
                pass

        today = timezone.localdate()
        start_date = today - timedelta(days=6)
        week_start_dt = timezone.make_aware(datetime.combine(start_date, dt_time.min))
        rows = (
            medias_qs.filter(created_at__gte=week_start_dt)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
        )
        day_counts = {r["day"]: r["count"] for r in rows if r["day"] is not None}

        medias_per_day = []
        for i in range(7):
            d = start_date + timedelta(days=i)
            medias_per_day.append({"date": d.isoformat(), "count": day_counts.get(d, 0)})

        evts = (
            Evenement.objects.filter(user=user)
            .annotate(medias_count=Count("medias"))
            .order_by("-medias_count")[:8]
        )
        medias_by_event = [
            {"slug": e.slug, "titre": e.titre, "medias_count": e.medias_count} for e in evts
        ]

        return Response(
            {
                "albums_total": albums_total,
                "medias_photo": medias_photo,
                "medias_video": medias_video,
                "guest_contributions": guest_contributions,
                "pending_moderation": pending_moderation,
                "storage_bytes": storage_bytes,
                "medias_per_day": medias_per_day,
                "medias_by_event": medias_by_event,
            }
        )


class PublicEventsListView(APIView):
    """Liste publique des événements en cours et futurs (avec album public)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        events_qs = (
            Evenement.objects.filter(actif=True)
            .prefetch_related("albums")
            .order_by("-date")
        )

        payload = []
        for evt in events_qs:
            public_album = next((a for a in evt.albums.all() if a.is_public or a.slug == "public"), None)
            if not public_album:
                continue
            payload.append(
                {
                    "titre": evt.titre,
                    "slug": evt.slug,
                    "public_code": evt.public_code,
                    "date": evt.date,
                    "expires_at": evt.expires_at,
                    "description": evt.description,
                    "album_public": {
                        "slug": public_album.slug,
                        "public_code": public_album.public_code,
                        "guest_upload_enabled": public_album.guest_upload_enabled,
                    },
                }
            )

        return Response(payload)

