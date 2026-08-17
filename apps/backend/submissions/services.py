from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from accounts.choices import UserRole, UserStatus
from accounts.models import User
from core.email import send_templated_email
from learning.models import Assignment
from submissions.models import Submission


def _format_score(value) -> str:
    return format(value, "f").rstrip("0").rstrip(".")


@transaction.atomic
def grade_submission(submission: Submission, grader, grade, feedback: str):
    if grade < 0 or grade > submission.assignment.max_points:
        raise ValidationError({"grade": f"Grade must be between 0 and {submission.assignment.max_points}."})
    was_graded = submission.score is not None
    submission.score = grade
    submission.feedback = feedback
    submission.graded_by = grader
    submission.graded_at = timezone.now()
    submission.is_locked = True
    submission.save(update_fields=["score", "feedback", "graded_by", "graded_at", "is_locked"])
    send_templated_email(
        subject=f"Your Nexus Academy submission grade was {'updated' if was_graded else 'posted'}: {submission.assignment.title}",
        template_name="grade_notification",
        context={
            "action": "updated" if was_graded else "posted",
            "graded_label": "updated" if was_graded else "graded",
            "assignment_title": submission.assignment.title,
            "score": _format_score(submission.score),
            "max_points": submission.assignment.max_points,
            "feedback": submission.feedback or "No feedback was provided.",
        },
        recipient_list=[submission.student.email],
    )
    return submission


@transaction.atomic
def manually_grade_missing_submission(assignment: Assignment, student_id: str, grader, grade, feedback: str):
    try:
        student = User.objects.get(id=student_id)
    except (User.DoesNotExist, ValueError) as exc:
        raise ValidationError({"student_id": "Student does not exist."}) from exc
    if student.role != UserRole.STUDENT or student.status != UserStatus.ACTIVE or student.cohort_id != assignment.cohort_id:
        raise ValidationError({"student_id": "Student must be active and enrolled in this assignment cohort."})

    submission, created = Submission.objects.get_or_create(
        assignment=assignment,
        student=student,
        defaults={
            "primary_link": "No submission - manually graded",
            "is_late": timezone.now() > assignment.due_date,
            "is_locked": True,
        },
    )
    if not created and submission.primary_link.strip() == "":
        submission.primary_link = "No submission - manually graded"
        submission.save(update_fields=["primary_link"])
    return grade_submission(submission, grader, grade, feedback)
