from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class CohortStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    ACTIVE = "ACTIVE", "Active"
    COMPLETED = "COMPLETED", "Completed"
    ARCHIVED = "ARCHIVED", "Archived"


class TeacherAssignmentRole(models.TextChoices):
    LEAD = "LEAD", "Lead Teacher"
    ASSISTANT = "ASSISTANT", "Assistant Teacher"
    MENTOR = "MENTOR", "Mentor"


class Cohort(models.Model):
    program = models.ForeignKey("programs.Program", on_delete=models.PROTECT, related_name="cohorts")
    name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    duration_weeks = models.PositiveIntegerField(default=12)
    current_week = models.PositiveIntegerField(default=1)
    leaderboard_visible = models.BooleanField(default=True)
    assignment_weight = models.DecimalField(max_digits=5, decimal_places=2, default=90)
    attendance_weight = models.DecimalField(max_digits=5, decimal_places=2, default=10)
    status = models.CharField(max_length=32, choices=CohortStatus.choices, default=CohortStatus.DRAFT)

    class Meta:
        ordering = ["-start_date", "name"]
        unique_together = ("program", "name")

    def __str__(self) -> str:
        return f"{self.program.title} - {self.name}"

    def clean(self) -> None:
        if self.assignment_weight < 0 or self.attendance_weight < 0:
            raise ValidationError("Grade weights cannot be negative.")
        if self.assignment_weight + self.attendance_weight != 100:
            raise ValidationError("Assignment and attendance weights must total 100.")


class TeacherAssignment(models.Model):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="teaching_assignments")
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name="teacher_assignments")
    role = models.CharField(max_length=32, choices=TeacherAssignmentRole.choices)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("teacher", "cohort", "role")
        ordering = ["cohort", "role"]

    def __str__(self) -> str:
        return f"{self.teacher.email} - {self.cohort} ({self.role})"
