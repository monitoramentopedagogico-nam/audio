from django.contrib import admin
from .models import Message

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "text", "created_at")
    readonly_fields = ("created_at",)

from .models import Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "latitude", "longitude", "accuracy", "recorded_at")
    readonly_fields = ("recorded_at",)
    ordering = ("-recorded_at",)

from .models import Recording


@admin.register(Recording)
class RecordingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "file", "created_at")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)
