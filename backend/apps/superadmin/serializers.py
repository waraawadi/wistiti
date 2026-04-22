from rest_framework import serializers

from apps.accounts.models import User
from apps.appconfig.models import AppConfig
from apps.evenements.models import Evenement
from apps.paiements.models import Paiement, Plan


class AdminPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = (
            "id",
            "nom",
            "prix_xof",
            "nb_uploads_max",
            "nb_evenements_max",
            "nb_albums_max",
            "duree_jours",
            "hq_enabled",
            "moderation_enabled",
            "moderation_avancee",
            "support_prioritaire",
        )

    def validate_nb_albums_max(self, value: int) -> int:
        # 1 = seul l’album public ; -1 = illimité (hors quota plan)
        if value != -1 and value < 1:
            raise serializers.ValidationError(
                "Minimum 1 album par événement (album public), ou -1 pour illimité.",
            )
        return value


class AdminBillingPricesSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppConfig
        fields = ("topup_price_per_photo_xof", "guest_download_price_per_photo_xof")

    def validate_topup_price_per_photo_xof(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError("Le prix doit être supérieur ou égal à 1 XOF.")
        return value

    def validate_guest_download_price_per_photo_xof(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError("Le prix doit être supérieur ou égal à 1 XOF.")
        return value


class AdminUserSerializer(serializers.ModelSerializer):
    plan_actif = AdminPlanSerializer(read_only=True)
    plan_actif_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "nom",
            "is_active",
            "is_staff",
            "is_superuser",
            "created_at",
            "expires_at",
            "plan_actif",
            "plan_actif_id",
        )
        read_only_fields = ("id", "created_at")


class AdminEvenementSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Evenement
        fields = (
            "id",
            "titre",
            "slug",
            "date",
            "actif",
            "moderation_active",
            "created_at",
            "expires_at",
            "user",
            "user_email",
        )
        read_only_fields = ("id", "slug", "created_at")


class AdminPaiementSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    plan_nom = serializers.CharField(source="plan.nom", read_only=True)

    class Meta:
        model = Paiement
        fields = (
            "id",
            "created_at",
            "user",
            "user_email",
            "plan",
            "plan_nom",
            "montant",
            "devise",
            "statut",
            "fedapay_transaction_id",
            "expires_at",
        )
        read_only_fields = ("id", "created_at")

