from django.contrib import admin

from .models import Album, AlbumQRCode, Evenement, Media, MediaFaceEncoding, QRCode, TextPost


@admin.register(Evenement)
class EvenementAdmin(admin.ModelAdmin):
    list_display = ("titre", "user", "public_code", "date", "actif", "moderation_active", "created_at")
    list_filter = ("actif", "moderation_active", "date", "created_at")
    search_fields = ("titre", "slug", "public_code", "user__email")
    prepopulated_fields = {"slug": ("titre",)}
    readonly_fields = ("created_at",)
    autocomplete_fields = ("user",)


@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ("nom", "evenement", "public_code", "is_public", "guest_upload_enabled", "created_at")
    list_filter = ("is_public", "guest_upload_enabled", "created_at")
    search_fields = ("nom", "slug", "public_code", "evenement__titre", "evenement__public_code")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("evenement",)


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ("id", "evenement", "album", "type", "approuve", "created_at")
    list_filter = ("type", "approuve", "created_at")
    search_fields = ("evenement__titre", "album__nom", "legende", "uploaded_by_ip")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("evenement", "album")


@admin.register(MediaFaceEncoding)
class MediaFaceEncodingAdmin(admin.ModelAdmin):
    list_display = ("media", "embedding_dim", "quality_score", "updated_at")
    search_fields = ("media__evenement__titre", "media__album__nom")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("media",)


@admin.register(TextPost)
class TextPostAdmin(admin.ModelAdmin):
    list_display = ("id", "evenement", "approuve", "created_at")
    list_filter = ("approuve", "created_at")
    search_fields = ("evenement__titre", "contenu")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("evenement",)


@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ("evenement", "url_cible", "created_at")
    search_fields = ("evenement__titre", "evenement__public_code", "url_cible")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("evenement",)


@admin.register(AlbumQRCode)
class AlbumQRCodeAdmin(admin.ModelAdmin):
    list_display = ("album", "url_cible", "created_at")
    search_fields = ("album__nom", "album__public_code", "url_cible")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("album",)