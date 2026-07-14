from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Announcement(models.Model):
    program = models.ForeignKey("programs.Program", on_delete=models.CASCADE, related_name="announcements", blank=True, null=True)
    cohort = models.ForeignKey("cohorts.Cohort", on_delete=models.CASCADE, related_name="announcements", blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="announcements")
    title = models.CharField(max_length=255)
    message = models.TextField()
    meeting_link = models.URLField(blank=True)
    scheduled_for = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-scheduled_for", "-created_at"]

    def clean(self) -> None:
        if not self.program_id and not self.cohort_id:
            raise ValidationError("Announcement must target a program or cohort.")

    def __str__(self) -> str:
        return self.title


class AnnouncementRead(models.Model):
    announcement = models.ForeignKey(Announcement, on_delete=models.CASCADE, related_name="read_receipts")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="announcement_reads")
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-read_at"]
        unique_together = ("announcement", "user")

    def __str__(self) -> str:
        return f"{self.user_id} read {self.announcement_id}"
