import os
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from .codes import generate_unique_album_code, generate_unique_event_code, normalize_public_code


def _evenement_storage_key(evt: "Evenement") -> str:
    if getattr(evt, "public_code", None):
        return evt.public_code
    return evt.slug or "evt"


def media_upload_to(instance: "Media", filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    return f"evenements/{_evenement_storage_key(instance.evenement)}/{uuid.uuid4().hex}{ext}"


def thumb_upload_to(instance: "Media", filename: str) -> str:
    return f"evenements/{_evenement_storage_key(instance.evenement)}/thumbs/{uuid.uuid4().hex}.jpg"


def qrcode_upload_to(instance: "QRCode", filename: str) -> str:
    return f"qrcodes/{_evenement_storage_key(instance.evenement)}.png"


def album_qrcode_upload_to(instance: "AlbumQRCode", filename: str) -> str:
    e = instance.album.evenement
    a = instance.album
    ek = _evenement_storage_key(e)
    ak = a.public_code or a.slug
    return f"qrcodes/{ek}/{ak}.png"


class Evenement(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="evenements")
    titre = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    # Code QR / URL courte : 3 lettres + 3 chiffres, unique globalement
    public_code = models.CharField(max_length=6, unique=True, blank=True, default="")
    date = models.DateTimeField()
    description = models.TextField(blank=True, default="")
    couleur_theme = models.CharField(max_length=7, blank=True, default="")  # hex optionnel
    bg_image = models.ImageField(upload_to="evenements/bg/", blank=True, null=True)
    actif = models.BooleanField(default=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    moderation_active = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self) -> str:
        return self.titre

    def _generate_unique_slug(self) -> str:
        base = slugify(self.titre)[:200] or uuid.uuid4().hex[:12]
        candidate = base
        i = 0
        while Evenement.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            i += 1
            candidate = f"{base}-{i}"
            if len(candidate) > 255:
                candidate = candidate[:255]
        return candidate

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        if not self.public_code:
            self.public_code = generate_unique_event_code(Evenement)
        else:
            self.public_code = normalize_public_code(self.public_code)
        super().save(*args, **kwargs)

    @property
    def public_url(self) -> str:
        # Page invité historique par slug (dashboard / liens internes)
        return f"{settings.PUBLIC_FRONTEND_BASE_URL}/evenement/{self.slug}"

    @property
    def qr_entry_base(self) -> str:
        return (settings.PUBLIC_QR_ENTRY_BASE_URL or settings.PUBLIC_FRONTEND_BASE_URL).rstrip("/")

    def qr_entry_url_for_album(self, album: "Album") -> str:
        base = self.qr_entry_base.rstrip("/")
        return f"{base}/{self.public_code}/{album.public_code}"

    def qr_upload_url_for_album(self, album: "Album") -> str:
        base = self.qr_entry_base.rstrip("/")
        return f"{base}/{self.public_code}/{album.public_code}/upload"


class Media(models.Model):
    class MediaType(models.TextChoices):
        PHOTO = "photo", "Photo"
        VIDEO = "video", "Vidéo"

    evenement = models.ForeignKey(Evenement, on_delete=models.CASCADE, related_name="medias")
    album = models.ForeignKey("Album", on_delete=models.CASCADE, related_name="medias", blank=True, null=True)
    fichier = models.FileField(upload_to=media_upload_to)
    thumbnail = models.ImageField(upload_to=thumb_upload_to, blank=True, null=True)
    type = models.CharField(max_length=10, choices=MediaType.choices)
    legende = models.CharField(max_length=255, blank=True, default="")
    approuve = models.BooleanField(default=False)
    uploaded_by_ip = models.GenericIPAddressField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class MediaFaceEncoding(models.Model):
    media = models.OneToOneField(Media, on_delete=models.CASCADE, related_name="face_encoding")
    embedding = models.JSONField(default=list)
    embedding_dim = models.PositiveSmallIntegerField(default=128)
    quality_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["created_at"]),
        ]


class TextPost(models.Model):
    evenement = models.ForeignKey(Evenement, on_delete=models.CASCADE, related_name="text_posts")
    contenu = models.TextField()
    style_decoration = models.CharField(max_length=80, blank=True, default="")
    approuve = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class QRCode(models.Model):
    evenement = models.OneToOneField(Evenement, on_delete=models.CASCADE, related_name="qrcode")
    image_path = models.ImageField(upload_to=qrcode_upload_to)
    url_cible = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)


class Album(models.Model):
    evenement = models.ForeignKey(Evenement, on_delete=models.CASCADE, related_name="albums")
    nom = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140)
    # Code album pour QR : 3 lettres + 3 chiffres, unique par événement
    public_code = models.CharField(max_length=6, blank=True, default="")
    is_public = models.BooleanField(default=False)
    guest_upload_enabled = models.BooleanField(
        default=True,
        help_text="Si False, les invités ne peuvent plus envoyer de médias sur cet album (QR / page album).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("evenement", "slug"),)
        constraints = [
            models.UniqueConstraint(fields=["evenement", "public_code"], name="uniq_album_pubcode_per_event"),
        ]
        indexes = [
            models.Index(fields=["evenement", "slug"]),
            models.Index(fields=["evenement", "public_code"]),
        ]

    def __str__(self) -> str:
        return f"{self.evenement_id}:{self.slug}"

    def _generate_unique_slug(self) -> str:
        base = slugify(self.nom)[:120] or uuid.uuid4().hex[:10]
        candidate = base
        i = 0
        while Album.objects.filter(evenement=self.evenement, slug=candidate).exclude(pk=self.pk).exists():
            i += 1
            candidate = f"{base}-{i}"
            if len(candidate) > 140:
                candidate = candidate[:140]
        return candidate

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()
        # public_code une fois l’événement connu (FK)
        if self.evenement_id and not self.public_code:
            self.public_code = generate_unique_album_code(self.evenement_id, Album)
        elif self.public_code:
            self.public_code = normalize_public_code(self.public_code)
        super().save(*args, **kwargs)

    @property
    def public_url(self) -> str:
        # URL encodée dans le QR : PUBLIC_QR_ENTRY_BASE_URL (défaut = frontend) / code_evt / code_album
        return self.evenement.qr_entry_url_for_album(self)

    @property
    def upload_url(self) -> str:
        return self.evenement.qr_upload_url_for_album(self)


class AlbumQRCode(models.Model):
    album = models.OneToOneField(Album, on_delete=models.CASCADE, related_name="qrcode")
    image_path = models.ImageField(upload_to=album_qrcode_upload_to)
    url_cible = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)
