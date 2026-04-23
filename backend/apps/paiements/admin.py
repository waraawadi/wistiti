from django.contrib import admin

from .models import GuestDownloadPurchase, Paiement, PhotoTopUp, Plan


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = (
        "nom",
        "prix_xof",
        "nb_uploads_max",
        "nb_evenements_max",
        "nb_albums_max",
        "duree_jours",
    )
    search_fields = ("nom",)


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "plan", "montant", "devise", "statut", "months_paid", "expires_at", "created_at")
    list_filter = ("statut", "devise", "created_at")
    search_fields = ("user__email", "plan__nom", "fedapay_transaction_id")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("user", "plan")


@admin.register(PhotoTopUp)
class PhotoTopUpAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "quantity", "montant", "statut", "fedapay_transaction_id", "created_at")
    list_filter = ("statut", "created_at")
    search_fields = ("user__email", "fedapay_transaction_id")
    readonly_fields = ("created_at",)
    autocomplete_fields = ("user",)


@admin.register(GuestDownloadPurchase)
class GuestDownloadPurchaseAdmin(admin.ModelAdmin):
    list_display = ("id", "user_email", "montant", "price_per_photo_xof", "statut", "created_at", "used_at")
    list_filter = ("statut", "created_at", "used_at")
    search_fields = ("user_email", "fedapay_transaction_id")
    readonly_fields = ("created_at",)
