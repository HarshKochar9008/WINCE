
from django.conf import settings
from decimal import Decimal

try:
    import stripe
except ImportError:
    stripe = None

def create_stripe_checkout_session(amount: Decimal, booking_id: int, session_title: str, customer_email: str = None, customer_name: str = None, currency: str = "inr"):
    
    if not settings.STRIPE_SECRET_KEY:
        raise ValueError("Stripe credentials not configured")

    if stripe is None:
        raise ImportError("stripe package is not installed")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    amount_in_smallest_unit = int(amount * 100)

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

        'billing_address_collection': 'required',
    }

    if customer_email:
        session_params['customer_email'] = customer_email

    if customer_name:
        session_params['metadata']['customer_name'] = customer_name

    checkout_session = stripe.checkout.Session.create(**session_params)

    return checkout_session
