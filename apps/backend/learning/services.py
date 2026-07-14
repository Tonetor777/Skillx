from django.db import transaction

from learning.models import Assignment


@transaction.atomic
def delete_or_lock_assignment(assignment: Assignment) -> tuple[Assignment | None, bool]:
    if assignment.submissions.exists():
        if not assignment.is_locked:
            assignment.is_locked = True
            assignment.save(update_fields=["is_locked"])
        return assignment, True
    assignment.delete()
    return None, False
