"""
Payment views for creating Razorpay orders
"""
from django.conf import settings
from rest_framework import status, throttling
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Booking
from .payments import create_razorpay_order


class PaymentThrottle(throttling.UserRateThrottle):
    rate = "10/minute"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([PaymentThrottle])
def create_payment_order(request):
    """
    Create a Razorpay order for a booking
    Expects: { "booking_id": <id> }
    Returns: { "order_id": "...", "amount": ..., "currency": "INR", "key_id": "..." }
    """
    if not settings.RAZORPAY_KEY_ID:
        return Response(
            {"detail": "Payment gateway is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    booking_id = request.data.get("booking_id")
    if not booking_id:
        return Response(
            {"detail": "booking_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response(
            {"detail": "Booking not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if booking.payment_status == "captured":
        return Response(
            {"detail": "Booking already paid."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        order = create_razorpay_order(booking.session.price, booking.id)
        return Response(
            {
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": settings.RAZORPAY_KEY_ID,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {"detail": f"Failed to create payment order: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
