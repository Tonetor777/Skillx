from django.db import models


class PlatformSettings(models.Model):
    branding_name = models.CharField(max_length=255, default="Skilix LMS")
    theme = models.CharField(max_length=32, default="zinc")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Platform settings"
        verbose_name_plural = "Platform settings"

    def __str__(self) -> str:
        return self.branding_name

    @classmethod
    def load(cls):
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings
