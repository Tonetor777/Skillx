from django.conf import settings
from django.db import models


class WeekStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PUBLISHED = "PUBLISHED", "Published"
    ARCHIVED = "ARCHIVED", "Archived"


class Week(models.Model):
    cohort = models.ForeignKey("cohorts.Cohort", on_delete=models.CASCADE, related_name="weeks")
    week_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    objectives = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    assignment = models.TextField(blank=True)
    recording = models.URLField(blank=True)
    status = models.CharField(max_length=32, choices=WeekStatus.choices, default=WeekStatus.DRAFT)
    publish_date = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_weeks")
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="published_weeks",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["cohort", "week_number"]
        unique_together = ("cohort", "week_number")

    def __str__(self) -> str:
        return f"{self.cohort} - Week {self.week_number}"


class Resource(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE, related_name="resources")
    title = models.CharField(max_length=255)
    url = models.URLField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["week", "order", "title"]

    def __str__(self) -> str:
        return self.title


class Assignment(models.Model):
    cohort = models.ForeignKey("cohorts.Cohort", on_delete=models.CASCADE, related_name="assignments")
    week = models.ForeignKey(Week, on_delete=models.SET_NULL, related_name="assignments", blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    max_points = models.PositiveIntegerField(default=100)
    due_date = models.DateTimeField()
    week_number = models.PositiveIntegerField(default=1)
    is_locked = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_assignments")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["cohort", "week_number", "due_date"]

    def __str__(self) -> str:
        return f"{self.cohort} - {self.title}"
