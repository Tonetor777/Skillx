from django.conf import settings
from django.db import models


class ModuleStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PUBLISHED = "PUBLISHED", "Published"
    ARCHIVED = "ARCHIVED", "Archived"


class Module(models.Model):
    cohort = models.ForeignKey("cohorts.Cohort", on_delete=models.CASCADE, related_name="modules")
    module_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=ModuleStatus.choices, default=ModuleStatus.DRAFT)
    publish_date = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_modules")
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="published_modules",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["cohort", "module_number", "id"]

    def __str__(self) -> str:
        return f"{self.cohort} - Module {self.module_number}"


class Lesson(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=255)
    objectives = models.TextField(blank=True)
    content = models.TextField(blank=True)
    recording = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["module", "order", "title"]
        unique_together = ("module", "order")

    def __str__(self) -> str:
        return self.title


class LessonImage(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="lessons/images/")
    alt_text = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="uploaded_lesson_images")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["lesson", "created_at"]

    def __str__(self) -> str:
        return self.alt_text or f"Image for {self.lesson}"


class Resource(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="resources")
    title = models.CharField(max_length=255)
    url = models.URLField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["lesson", "order", "title"]

    def __str__(self) -> str:
        return self.title


class Assignment(models.Model):
    cohort = models.ForeignKey("cohorts.Cohort", on_delete=models.CASCADE, related_name="assignments")
    module = models.ForeignKey(Module, on_delete=models.SET_NULL, related_name="assignments", blank=True, null=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, related_name="assignments", blank=True, null=True)
    resource = models.ForeignKey(Resource, on_delete=models.SET_NULL, related_name="assignments", blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    max_points = models.PositiveIntegerField(default=100)
    due_date = models.DateTimeField()
    is_locked = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_assignments")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["cohort", "module__module_number", "lesson__order", "due_date"]

    def __str__(self) -> str:
        return f"{self.cohort} - {self.title}"
