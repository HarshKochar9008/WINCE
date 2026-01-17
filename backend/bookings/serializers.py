from rest_framework import serializers

from sessions.models import Session
from sessions.serializers import SessionSerializer

from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    session_id = serializers.PrimaryKeyRelatedField(source="session", queryset=Session.objects.all(), write_only=True)
    session = SessionSerializer(read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Booking
        fields = (
            "id",
            "user",
            "session",
            "session_id",
            "status",
            "payment_id",
            "payment_status",
            "amount_paid",
            "created_at",
        )
        read_only_fields = ("id", "user", "session", "status", "payment_id", "payment_status", "amount_paid", "created_at")

    def validate(self, attrs):
        request = self.context.get("request")
        session = attrs.get("session")
        user = getattr(request, "user", None)
        if not user:
            raise serializers.ValidationError({"detail": "Authentication required."})

        if session and session.creator_id == user.id:
            raise serializers.ValidationError({"session_id": "You cannot book your own session."})
        return attrs
