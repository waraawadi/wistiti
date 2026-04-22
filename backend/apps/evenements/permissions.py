from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = getattr(obj, "user", None)
        return bool(request.user and request.user.is_authenticated and user == request.user)

