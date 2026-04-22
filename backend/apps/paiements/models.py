from django.conf import settings
from django.db import models


class Plan(models.Model):
    nom = models.CharField(max_length=120, unique=True)
    prix_xof = models.PositiveIntegerField()
    nb_uploads_max = models.IntegerField(default=-1)  # -1 = illimité
    nb_evenements_max = models.IntegerField(default=-1)  # -1 = illimité
    nb_albums_max = models.IntegerField(default=2)  # -1 = illimité
    duree_jours = models.PositiveIntegerField(default=30)
    hq_enabled = models.BooleanField(default=True)
    moderation_enabled = models.BooleanField(default=True)
    moderation_avancee = models.BooleanField(default=False)
    support_prioritaire = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.nom


class Paiement(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="paiements")
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="paiements")
    montant = models.PositiveIntegerField()
    devise = models.CharField(max_length=10, default="XOF")
    statut = models.CharField(max_length=40)
    fedapay_transaction_id = models.CharField(max_length=120, blank=True, default="")
    months_paid = models.PositiveIntegerField(default=1)
    expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.user_id} - {self.plan_id} - {self.statut}"


class PhotoTopUp(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="photo_topups")
    quantity = models.PositiveIntegerField()
    price_per_photo_xof = models.PositiveIntegerField()
    montant = models.PositiveIntegerField()
    statut = models.CharField(max_length=40, default="pending")
    fedapay_transaction_id = models.CharField(max_length=120, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)


class GuestDownloadPurchase(models.Model):
    user_email = models.EmailField(blank=True, default="")
    media_ids = models.JSONField(default=list)
    montant = models.PositiveIntegerField()
    price_per_photo_xof = models.PositiveIntegerField()
    statut = models.CharField(max_length=40, default="pending")
    fedapay_transaction_id = models.CharField(max_length=120, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(blank=True, null=True)
