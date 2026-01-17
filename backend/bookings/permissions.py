from rest_framework import permissions

class BookingPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        if request.method == 'POST':
            return True

        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        return bool(obj.user_id == user.id or obj.session.creator_id == user.id)
