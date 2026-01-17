"""
Payment utilities for Stripe integration
"""
from django.conf import settings
from decimal import Decimal

try:
    import stripe
except ImportError:
    stripe = None


def create_stripe_checkout_session(amount: Decimal, booking_id: int, session_title: str, customer_email: str = None, customer_name: str = None, currency: str = "inr"):
    """
    Create a Stripe Checkout Session for booking payment
    
    For Indian export transactions, customer name and address are required per regulations.
    See: https://stripe.com/docs/india-exports
    
    Args:
        amount: Payment amount
        booking_id: Booking ID
        session_title: Title of the session being booked
        customer_email: Customer email address (required for Indian exports)
        customer_name: Customer name (required for Indian exports)
        currency: Currency code (default: "inr")
    
    Returns session details with session_id and url
    """
    if not settings.STRIPE_SECRET_KEY:
        raise ValueError("Stripe credentials not configured")

    if stripe is None:
        raise ImportError("stripe package is not installed")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    # Convert Decimal to smallest currency unit (paise for INR, cents for USD)
    amount_in_smallest_unit = int(amount * 100)

    # Build checkout session parameters
    session_params = {
        'payment_method_types': ['card'],
        'line_items': [{
            'price_data': {
                'currency': currency,
                'product_data': {
                    'name': session_title,
                    'description': f'Booking #{booking_id}',
                },
                'unit_amount': amount_in_smallest_unit,
            },
            'quantity': 1,
        }],
        'mode': 'payment',
        'success_url': f"{settings.FRONTEND_URL}/dashboard?payment=success&booking_id={booking_id}",
        'cancel_url': f"{settings.FRONTEND_URL}/dashboard?payment=cancelled",
        'client_reference_id': str(booking_id),
        'metadata': {
            'booking_id': booking_id,
        },
        # Indian export regulations require customer name and billing address
        # See: https://stripe.com/docs/india-exports
        'billing_address_collection': 'required',  # Required for Indian export compliance
    }
    
    # Add customer email if provided (required for Indian exports)
    if customer_email:
        session_params['customer_email'] = customer_email
    
    # Add customer name to metadata for export compliance
    if customer_name:
        session_params['metadata']['customer_name'] = customer_name

    # Create checkout session
    checkout_session = stripe.checkout.Session.create(**session_params)

    return checkout_session
