from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from submissions.models import Submission


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
    send_mail(
        subject=f"Your Skilix submission grade was {'updated' if was_graded else 'posted'}: {submission.assignment.title}",
        message=(
            f"Your submission for {submission.assignment.title} has been {'updated' if was_graded else 'graded'}.\n"
            f"Score: {submission.score}/{submission.assignment.max_points}\n\n"
            f"Feedback:\n{submission.feedback}\n"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[submission.student.email],
        fail_silently=False,
    )
    return submission
