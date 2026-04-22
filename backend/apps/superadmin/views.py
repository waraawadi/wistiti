from rest_framework import generics, permissions, status
from rest_framework.response import Response

from apps.accounts.models import User
from apps.appconfig.models import AppConfig
from apps.evenements.models import Evenement
from apps.paiements.models import Paiement, Plan
from django.core.cache import cache

from .serializers import (
    AdminBillingPricesSerializer,
    AdminEvenementSerializer,
    AdminPaiementSerializer,
    AdminPlanSerializer,
    AdminUserSerializer,
)


class AdminUserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserSerializer
    queryset = User.objects.select_related("plan_actif").order_by("-created_at")


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminUserSerializer
    queryset = User.objects.select_related("plan_actif").order_by("-created_at")

    def perform_update(self, serializer):
        plan_id = serializer.validated_data.pop("plan_actif_id", None)
        instance = serializer.save()
        if plan_id is not None:
            if plan_id in (None, 0):
                instance.plan_actif = None
            else:
                instance.plan_actif = Plan.objects.get(pk=int(plan_id))
            instance.save(update_fields=["plan_actif"])


class AdminEvenementListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminEvenementSerializer
    queryset = Evenement.objects.select_related("user").order_by("-created_at")


class AdminPlanListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminPlanSerializer
    queryset = Plan.objects.order_by("prix_xof")


class AdminPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminPlanSerializer
    queryset = Plan.objects.order_by("prix_xof")


class AdminBillingPricesView(generics.GenericAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminBillingPricesSerializer

    def get(self, request):
        row = AppConfig.load()
        return Response(self.get_serializer(row).data)

    def patch(self, request):
        row = AppConfig.load()
        serializer = self.get_serializer(row, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        cache.delete("config:public")
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminPaiementListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminPaiementSerializer
    queryset = Paiement.objects.select_related("user", "plan").order_by("-created_at")

