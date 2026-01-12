from django.contrib import admin

from .models import Session


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "creator", "price", "start_time")
    search_fields = ("title", "creator__email")
