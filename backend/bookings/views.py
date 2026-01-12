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

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def verify_payment(self, request, pk=None):
        """Verify Razorpay payment and update booking status"""
        booking = self.get_object()
        if booking.user != request.user:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        payment_id = request.data.get("payment_id")
        razorpay_signature = request.data.get("razorpay_signature")
        razorpay_order_id = request.data.get("razorpay_order_id")

        if not all([payment_id, razorpay_signature, razorpay_order_id]):
            return Response(
                {"detail": "payment_id, razorpay_signature, and razorpay_order_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            import razorpay
            from razorpay import errors

            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": razorpay_order_id,
                    "razorpay_payment_id": payment_id,
                    "razorpay_signature": razorpay_signature,
                }
            )

            payment = client.payment.fetch(payment_id)
            booking.payment_id = payment_id
            booking.payment_status = payment.get("status", "failed")
            booking.amount_paid = booking.session.price

            if payment.get("status") == "captured":
                booking.status = Booking.Status.CONFIRMED
            else:
                booking.status = Booking.Status.PENDING

            booking.save()

            return Response(
                {
                    "detail": "Payment verified successfully.",
                    "booking": BookingSerializer(booking, context={"request": request}).data,
                },
                status=status.HTTP_200_OK,
            )
        except errors.SignatureVerificationError:
            return Response({"detail": "Invalid payment signature."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Payment verification failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
