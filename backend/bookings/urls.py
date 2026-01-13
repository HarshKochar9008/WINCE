from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .payment_views import create_payment_order
from .views import BookingViewSet

router = DefaultRouter()
router.register("", BookingViewSet, basename="booking")

urlpatterns = [
    path("create-payment-order/", create_payment_order, name="create-payment-order"),
    path("", include(router.urls)),
]
