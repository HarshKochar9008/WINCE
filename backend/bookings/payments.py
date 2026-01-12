"""
Payment utilities for Razorpay integration
"""
from django.conf import settings
from decimal import Decimal

try:
    import razorpay
except ImportError:
    razorpay = None


def create_razorpay_order(amount: Decimal, booking_id: int, currency: str = "INR"):
    """
    Create a Razorpay order for booking payment
    Returns order details with order_id
    """
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise ValueError("Razorpay credentials not configured")

    if razorpay is None:
        raise ImportError("razorpay package is not installed")

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    # Convert Decimal to paise (Razorpay uses smallest currency unit)
    amount_in_paise = int(amount * 100)

    order_data = {
        "amount": amount_in_paise,
        "currency": currency,
        "receipt": f"booking_{booking_id}",
        "notes": {
            "booking_id": booking_id,
        },
    }

    order = client.order.create(data=order_data)
    return order
