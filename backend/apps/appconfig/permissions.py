from rest_framework import permissions


class IsSuperUser(permissions.BasePermission):
    """Seuls les superutilisateurs peuvent modifier la config."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)
