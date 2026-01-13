from django.conf import settings
from rest_framework import mixins, status, throttling, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Booking
from .permissions import BookingPermission
from .serializers import BookingSerializer


class BookingThrottle(throttling.UserRateThrottle):
    rate = "10/minute"


class BookingViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = BookingSerializer
    permission_classes = [BookingPermission]
    throttle_classes = [BookingThrottle]

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related("user", "session", "session__creator").order_by("-created_at")
        if getattr(user, "role", None) == "CREATOR":
            return qs.filter(session__creator=user)
        return qs.filter(user=user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        """Create a booking, handling duplicate booking attempts gracefully"""
        from django.db import IntegrityError
        
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"detail": "You have already booked this session. Check your dashboard to see your existing booking."}
            )

    @action(detail=True, methods=["post"])
    def verify_payment(self, request, pk=None):
        """Verify Stripe payment and update booking status"""
        booking = self.get_object()
        if booking.user != request.user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        session_id = request.data.get("session_id")

        if not session_id:
            return Response(
                {"detail": "session_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            import stripe

            stripe.api_key = settings.STRIPE_SECRET_KEY
            
            # Retrieve the checkout session from Stripe
            checkout_session = stripe.checkout.Session.retrieve(session_id)

            # Verify the session belongs to this booking
            if str(checkout_session.client_reference_id) != str(booking.id):
                return Response(
                    {"detail": "Session does not match booking."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update booking based on payment status
            booking.payment_id = checkout_session.payment_intent
            
            if checkout_session.payment_status == "paid":
                booking.payment_status = "paid"
                booking.amount_paid = booking.session.price
                booking.status = Booking.Status.CONFIRMED
            elif checkout_session.payment_status == "unpaid":
                booking.payment_status = "unpaid"
                booking.status = Booking.Status.PENDING
            else:
                booking.payment_status = checkout_session.payment_status
                booking.status = Booking.Status.PENDING

            booking.save()

            return Response(
                {
                    "detail": "Payment verified successfully.",
                    "booking": BookingSerializer(booking, context={"request": request}).data,
                },
                status=status.HTTP_200_OK,
            )
        except stripe.error.StripeError as e:
            return Response(
                {"detail": f"Stripe error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"detail": f"Payment verification failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
