from rest_framework import serializers

from .models import Paiement, Plan


class PlanSerializer(serializers.ModelSerializer):
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


class PaiementSerializer(serializers.ModelSerializer):
    plan = PlanSerializer()

    class Meta:
        model = Paiement
        fields = (
            "id",
            "plan",
            "montant",
            "devise",
            "statut",
            "fedapay_transaction_id",
            "months_paid",
            "expires_at",
            "created_at",
        )


class InitierPaiementSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    months = serializers.IntegerField(min_value=1, max_value=24, required=False, default=1)
    checkout_mode = serializers.ChoiceField(
        choices=("redirect", "checkout_js"),
        default="redirect",
        required=False,
    )


class SynchroniserPaiementSerializer(serializers.Serializer):
    transaction_id = serializers.CharField()
    include_fedapay = serializers.BooleanField(required=False, default=False)

