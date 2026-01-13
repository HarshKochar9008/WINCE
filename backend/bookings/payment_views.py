"""
Payment views for creating Stripe Checkout Sessions
"""
from django.conf import settings
from rest_framework import status, throttling
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Booking
from .payments import create_stripe_checkout_session


class PaymentThrottle(throttling.UserRateThrottle):
    rate = "10/minute"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([PaymentThrottle])
def create_payment_order(request):
    """
    Create a Stripe Checkout Session for a booking
    Expects: { "booking_id": <id> }
    Returns: { "session_id": "...", "url": "...", "publishable_key": "..." }
    """
    if not settings.STRIPE_SECRET_KEY:
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
        booking = Booking.objects.select_related("session").get(id=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response(
            {"detail": "Booking not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if booking.payment_status == "paid":
        return Response(
            {"detail": "Booking already paid."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Skip payment for free sessions
    from decimal import Decimal
    if booking.session.price == Decimal('0'):
        return Response(
            {"detail": "This is a free session. No payment required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Get user information for Indian export compliance
        # Indian regulations require customer name and address for export transactions
        checkout_session = create_stripe_checkout_session(
            amount=booking.session.price, 
            booking_id=booking.id,
            session_title=booking.session.title,
            customer_email=request.user.email,
            customer_name=request.user.name,
        )
        return Response(
            {
                "session_id": checkout_session.id,
                "url": checkout_session.url,
                "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {"detail": f"Failed to create payment session: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
