from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Submission(models.Model):
    assignment = models.ForeignKey("learning.Assignment", on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions")
    primary_link = models.TextField()
    secondary_link = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_late = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="graded_submissions",
        blank=True,
        null=True,
    )
    graded_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-submitted_at"]
        unique_together = ("assignment", "student")

    def clean(self) -> None:
        if self.score is not None and (self.score < 0 or self.score > 100):
            raise ValidationError({"score": "Score must be between 0 and 100."})

    def __str__(self) -> str:
        return f"{self.student.email} - {self.assignment}"
