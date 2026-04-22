from django.urls import path

from .views import (
    AdminBillingPricesView,
    AdminEvenementListView,
    AdminPaiementListView,
    AdminPlanDetailView,
    AdminPlanListCreateView,
    AdminUserDetailView,
    AdminUserListView,
)

urlpatterns = [
    path("users/", AdminUserListView.as_view(), name="admin-users-list"),
    path("users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-users-detail"),
    path("evenements/", AdminEvenementListView.as_view(), name="admin-evenements-list"),
    path("billing-prices/", AdminBillingPricesView.as_view(), name="admin-billing-prices"),
    path("plans/", AdminPlanListCreateView.as_view(), name="admin-plans-list-create"),
    path("plans/<int:pk>/", AdminPlanDetailView.as_view(), name="admin-plans-detail"),
    path("paiements/", AdminPaiementListView.as_view(), name="admin-paiements-list"),
]

