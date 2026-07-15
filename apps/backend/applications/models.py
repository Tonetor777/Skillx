from django.conf import settings
from django.db import models


class ApplicationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    WITHDRAWN = "WITHDRAWN", "Withdrawn"


class InvitationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACCEPTED = "ACCEPTED", "Accepted"
    EXPIRED = "EXPIRED", "Expired"
    REVOKED = "REVOKED", "Revoked"


class ExperienceLevel(models.TextChoices):
    BEGINNER = "BEGINNER", "Beginner"
    INTERMEDIATE = "INTERMEDIATE", "Intermediate"
    ADVANCED = "ADVANCED", "Advanced"
    PROFESSIONAL = "PROFESSIONAL", "Professional"


class Application(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=64)
    age = models.PositiveSmallIntegerField()
    experience = models.CharField(max_length=32, choices=ExperienceLevel.choices)
    expectations = models.TextField()
    program = models.ForeignKey("programs.Program", on_delete=models.PROTECT, related_name="applications")
    status = models.CharField(max_length=32, choices=ApplicationStatus.choices, default=ApplicationStatus.PENDING)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="reviewed_applications",
        blank=True,
        null=True,
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self) -> str:
        return f"{self.name} - {self.program.title}"


class Invitation(models.Model):
    email = models.EmailField()
    cohort = models.ForeignKey("cohorts.Cohort", on_delete=models.PROTECT, related_name="invitations")
    token = models.CharField(max_length=128, unique=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=32, choices=InvitationStatus.choices, default=InvitationStatus.PENDING)

    class Meta:
        ordering = ["-expires_at"]

    def __str__(self) -> str:
        return f"{self.email} - {self.cohort}"
