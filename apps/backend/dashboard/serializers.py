from rest_framework import serializers

from dashboard.models import PlatformSettings


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = ["branding_name", "theme"]
