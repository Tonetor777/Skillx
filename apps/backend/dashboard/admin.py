from django.contrib import admin

from dashboard.models import PlatformSettings


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ("branding_name", "theme", "updated_at")
