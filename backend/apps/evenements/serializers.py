from rest_framework import serializers

from .models import Album, AlbumQRCode, Evenement, Media, QRCode


class EvenementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evenement
        fields = (
            "id",
            "titre",
            "slug",
            "public_code",
            "date",
            "description",
            "couleur_theme",
            "bg_image",
            "actif",
            "expires_at",
            "moderation_active",
            "created_at",
        )
        read_only_fields = ("id", "slug", "public_code", "created_at")


class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ("id", "fichier", "thumbnail", "type", "legende", "approuve", "created_at")
        read_only_fields = ("id", "approuve", "created_at")


class PublicAlbumMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ("id", "fichier", "thumbnail", "type", "legende", "created_at")


class QRCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRCode
        fields = ("url_cible", "image_path", "created_at")


class AlbumSerializer(serializers.ModelSerializer):
    qrcode_url = serializers.SerializerMethodField()
    entry_url = serializers.SerializerMethodField()
    medias_count = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = (
            "id",
            "nom",
            "slug",
            "public_code",
            "is_public",
            "guest_upload_enabled",
            "created_at",
            "medias_count",
            "qrcode_url",
            "entry_url",
        )
        read_only_fields = ("id", "slug", "public_code", "created_at", "medias_count", "qrcode_url", "entry_url")

    def get_medias_count(self, obj: Album) -> int:
        c = getattr(obj, "medias_count", None)
        if c is not None:
            return int(c)
        return obj.medias.count()

    def get_qrcode_url(self, obj: Album) -> str:
        return f"/api/evenements/by-code/{obj.evenement.public_code}/{obj.public_code}/qrcode/"

    def get_entry_url(self, obj: Album) -> str:
        return obj.public_url


class AlbumQRCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlbumQRCode
        fields = ("url_cible", "image_path", "created_at")

