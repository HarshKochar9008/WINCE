import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import Session
from .permissions import SessionPermission
from .serializers import SessionSerializer

logger = logging.getLogger(__name__)


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related("creator").all().order_by("-start_time")
    serializer_class = SessionSerializer
    permission_classes = [SessionPermission]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context
    
    def list(self, request, *args, **kwargs):
        """Override list to add error handling."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.exception(f"Error listing sessions: {e}")
            return Response(
                {"detail": "An error occurred while fetching sessions."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        """Upload image file for session"""
        session = self.get_object()
        if session.creator != request.user:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if "image" not in request.FILES:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.image_file = request.FILES["image"]
        session.save()

        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)
