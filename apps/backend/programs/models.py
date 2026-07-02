from django.db import models


class ProgramStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ACTIVE = "ACTIVE", "Active"
    ARCHIVED = "ARCHIVED", "Archived"


class ProgramLevel(models.TextChoices):
    BEGINNER = "BEGINNER", "Beginner"
    INTERMEDIATE = "INTERMEDIATE", "Intermediate"
    ADVANCED = "ADVANCED", "Advanced"


class Program(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    syllabus = models.JSONField(default=list, blank=True)
    duration_weeks = models.PositiveIntegerField(default=12)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    level = models.CharField(max_length=32, choices=ProgramLevel.choices, default=ProgramLevel.BEGINNER)
    thumbnail = models.ImageField(upload_to="programs/", blank=True, null=True)
    status = models.CharField(max_length=32, choices=ProgramStatus.choices, default=ProgramStatus.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title
