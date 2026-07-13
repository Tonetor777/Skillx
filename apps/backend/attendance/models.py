from django.conf import settings
from django.db import models


class AttendanceStatus(models.TextChoices):
    PRESENT = "PRESENT", "Present"
    LATE = "LATE", "Late"
    EXCUSED = "EXCUSED", "Excused"
    ABSENT = "ABSENT", "Absent"


ATTENDANCE_CREDIT = {
    AttendanceStatus.PRESENT: 1,
    AttendanceStatus.EXCUSED: 1,
    AttendanceStatus.LATE: 0.5,
    AttendanceStatus.ABSENT: 0,
}


class AttendanceSession(models.Model):
    cohort = models.ForeignKey("cohorts.Cohort", on_delete=models.CASCADE, related_name="attendance_sessions")
    date = models.DateField()
    title = models.CharField(max_length=255, blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="recorded_attendance_sessions",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "cohort__name"]
        unique_together = ("cohort", "date")

    def __str__(self) -> str:
        return f"{self.cohort} - {self.date}"


class AttendanceRecord(models.Model):
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name="records")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendance_records")
    status = models.CharField(max_length=16, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    note = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="recorded_attendance_records",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["student__first_name", "student__last_name", "student__email"]
        unique_together = ("session", "student")

    @property
    def credit(self) -> float:
        return float(ATTENDANCE_CREDIT.get(self.status, 0))

    def __str__(self) -> str:
        return f"{self.student.email} - {self.session.date} - {self.status}"
