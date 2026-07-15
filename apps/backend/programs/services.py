from rest_framework.exceptions import ValidationError

from programs.models import Program


def delete_empty_program(program: Program) -> None:
    blockers = []
    if program.cohorts.exists():
        blockers.append("cohorts")
    if program.applications.exists():
        blockers.append("applications")
    if program.announcements.exists():
        blockers.append("announcements")
    if blockers:
        raise ValidationError({"detail": f"Program cannot be deleted while it has {', '.join(blockers)}."})
    program.delete()
