from rest_framework import permissions


class SessionPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", None) == "CREATOR")

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", None) == "CREATOR" and obj.creator_id == user.id)
