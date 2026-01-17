from django.conf import settings
from django.db import models

from sessions.models import Session


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "PENDING"
        CONFIRMED = "CONFIRMED", "CONFIRMED"
        CANCELLED = "CANCELLED", "CANCELLED"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings")
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="bookings")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_id = models.CharField(max_length=255, blank=True, help_text="Razorpay payment ID")
    payment_status = models.CharField(max_length=50, blank=True, default="pending")
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "session"], name="unique_booking_per_user_session"),
        ]

    def __str__(self):
        return str(self.id)
