from django.conf import settings
from django.db import models

class Session(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sessions")
    image = models.URLField(blank=True)
    image_file = models.ImageField(upload_to="sessions/", blank=True, null=True, help_text="Upload image file")
    start_time = models.DateTimeField()
    duration = models.DurationField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
