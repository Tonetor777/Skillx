from rest_framework.exceptions import ValidationError

from cohorts.models import Cohort


def delete_empty_cohort(cohort: Cohort) -> None:
    blockers = []
    if cohort.students.exists():
        blockers.append("students")
    if cohort.invitations.exists():
        blockers.append("invitations")
    if cohort.teacher_assignments.exists():
        blockers.append("teacher assignments")
    if cohort.modules.exists():
        blockers.append("curriculum")
    if cohort.assignments.exists():
        blockers.append("assignments")
    if cohort.attendance_sessions.exists():
        blockers.append("attendance")
    if cohort.announcements.exists():
        blockers.append("announcements")
    if blockers:
        raise ValidationError({"detail": f"Cohort cannot be deleted while it has {', '.join(blockers)}."})
    cohort.delete()
