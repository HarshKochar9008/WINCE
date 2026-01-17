from rest_framework import serializers

from .models import Session

class SessionSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = (
            "id",
            "title",
            "description",
            "price",
            "creator",
            "image",
            "image_file",
            "image_url",
            "start_time",
            "duration",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "creator", "created_at", "updated_at", "image_url")
        extra_kwargs = {
            "image_file": {"write_only": True},
        }

    def get_image_url(self, obj):
        if obj.image_file:
            try:
                request = self.context.get("request") if self.context else None
                if request:
                    return request.build_absolute_uri(obj.image_file.url)
                return obj.image_file.url
            except Exception as e:

                import logging
                logger = logging.getLogger(__name__)
                logger.debug(f"Error getting image_url for session {obj.id}: {e}")
                return obj.image or ""
        return obj.image or ""

    def to_representation(self, instance):
        
        data = super().to_representation(instance)

        data.pop("image_file", None)
        return data
