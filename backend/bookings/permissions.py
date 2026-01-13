from rest_framework import permissions


class BookingPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        # Both users and creators can create bookings
        if request.method == 'POST':
            return True
        # Users can list/view their bookings, creators can view bookings for their sessions
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        # Only creators can view their bookings, or session creators can view bookings for their sessions
        return bool(obj.user_id == user.id or obj.session.creator_id == user.id)
