from django.urls import path

from .views import (
    HistoriquePaiementsView,
    InitierPaiementView,
    InitierRechargePhotosView,
    InitierInviteTelechargementView,
    InviteTelechargementZipView,
    PlansPublicView,
    SynchroniserPaiementView,
    UsageView,
    WebhookPaiementView,
)

urlpatterns = [
    path("initier/", InitierPaiementView.as_view(), name="paiements-initier"),
    path("recharge-photos/initier/", InitierRechargePhotosView.as_view(), name="paiements-recharge-photos-initier"),
    path("invite/initier-telechargement/", InitierInviteTelechargementView.as_view(), name="paiements-invite-initier"),
    path("invite/telecharger-zip/", InviteTelechargementZipView.as_view(), name="paiements-invite-telecharger-zip"),
    path("synchroniser/", SynchroniserPaiementView.as_view(), name="paiements-synchroniser"),
    path("plans/", PlansPublicView.as_view(), name="paiements-plans"),
    path("webhook/", WebhookPaiementView.as_view(), name="paiements-webhook"),
    path("historique/", HistoriquePaiementsView.as_view(), name="paiements-historique"),
    path("usage/", UsageView.as_view(), name="paiements-usage"),
]
