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

    def get_image_url(self, obj):
        if obj.image_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image_file.url)
            return obj.image_file.url
        return obj.image or ""
