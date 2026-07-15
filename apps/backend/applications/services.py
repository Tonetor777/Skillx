from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import secrets
from rest_framework.exceptions import ValidationError

from accounts.choices import UserRole, UserStatus
from applications.models import Application, ApplicationStatus, Invitation, InvitationStatus
from cohorts.models import Cohort, CohortStatus


def _split_name(name: str) -> tuple[str, str]:
    parts = name.strip().split()
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


@transaction.atomic
def approve_application(application: Application, reviewer, cohort_id: str | None = None):
    if application.status != ApplicationStatus.PENDING:
        raise ValidationError({"detail": "Only pending applications can be approved."})
    if not cohort_id:
        raise ValidationError({"cohort_id": "A cohort is required before approving this application."})

    try:
        cohort = Cohort.objects.get(id=cohort_id)
    except Cohort.DoesNotExist as exc:
        raise ValidationError({"cohort_id": "Cohort does not exist."}) from exc
    if cohort.program_id != application.program_id:
        raise ValidationError({"cohort_id": "Selected cohort must belong to the applicant's program."})
    if cohort.status in {CohortStatus.COMPLETED, CohortStatus.ARCHIVED}:
        raise ValidationError({"cohort_id": "Selected cohort must be upcoming or active."})

    application.status = ApplicationStatus.APPROVED
    application.reviewed_by = reviewer
    application.reviewed_at = timezone.now()
    application.save(update_fields=["status", "reviewed_by", "reviewed_at"])
    create_invitation_for_application(application, cohort)
    return application


@transaction.atomic
def reject_application(application: Application, reviewer):
    if application.status != ApplicationStatus.PENDING:
        raise ValidationError({"detail": "Only pending applications can be rejected."})
    application.status = ApplicationStatus.REJECTED
    application.reviewed_by = reviewer
    application.reviewed_at = timezone.now()
    application.save(update_fields=["status", "reviewed_by", "reviewed_at"])
    return application


def _invitation_expiry():
    return timezone.now() + timedelta(hours=getattr(settings, "INVITATION_EXPIRY_HOURS", 72))


def _frontend_url(path: str) -> str:
    base_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{base_url}{path}"


@transaction.atomic
def create_invitation_for_application(application: Application, cohort: Cohort | None = None) -> Invitation:
    if application.status != ApplicationStatus.APPROVED:
        raise ValidationError({"detail": "Only approved applications can receive invitations."})
    if cohort is None:
        cohort = (
            Cohort.objects.filter(program=application.program, status=CohortStatus.ACTIVE)
            .order_by("start_date")
            .first()
        )
    if cohort is None:
        raise ValidationError({"detail": "A cohort is required before inviting this applicant."})

    Invitation.objects.filter(email=application.email, status=InvitationStatus.PENDING).update(
        status=InvitationStatus.REVOKED
    )
    invitation = Invitation.objects.create(
        email=application.email,
        cohort=cohort,
        token=secrets.token_urlsafe(48),
        expires_at=_invitation_expiry(),
    )
    send_invitation_email(invitation)
    return invitation


@transaction.atomic
def reinvite_application(application: Application) -> Invitation:
    if application.status != ApplicationStatus.APPROVED:
        raise ValidationError({"detail": "Only approved applications can be reinvited."})

    latest_invitation = (
        Invitation.objects.select_related("cohort", "cohort__program")
        .filter(email=application.email)
        .order_by("-expires_at")
        .first()
    )
    if latest_invitation is None:
        raise ValidationError({"detail": "This approved application does not have an invitation to refresh."})
    if latest_invitation.status == InvitationStatus.ACCEPTED:
        raise ValidationError({"detail": "Accepted invitations cannot be resent."})
    if latest_invitation.cohort.program_id != application.program_id:
        raise ValidationError({"detail": "The latest invitation does not match this applicant's program."})

    return create_invitation_for_application(application, latest_invitation.cohort)


def send_invitation_email(invitation: Invitation) -> None:
    accept_url = _frontend_url(f"/accept-invitation?token={invitation.token}")
    send_mail(
        subject="Your Skilix invitation",
        message=f"You have been invited to join {invitation.cohort.name}. Accept your invitation: {accept_url}\n",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invitation.email],
        fail_silently=False,
    )


@transaction.atomic
def resend_invitation(invitation: Invitation) -> Invitation:
    if invitation.status != InvitationStatus.PENDING:
        raise ValidationError({"detail": "Only pending invitations can be resent."})
    invitation.token = secrets.token_urlsafe(48)
    invitation.expires_at = _invitation_expiry()
    invitation.save(update_fields=["token", "expires_at"])
    send_invitation_email(invitation)
    return invitation


@transaction.atomic
def revoke_invitation(invitation: Invitation) -> Invitation:
    if invitation.status == InvitationStatus.ACCEPTED:
        raise ValidationError({"detail": "Accepted invitations cannot be revoked."})
    invitation.status = InvitationStatus.REVOKED
    invitation.save(update_fields=["status"])
    return invitation


@transaction.atomic
def accept_invitation(token: str, password: str):
    invitation = Invitation.objects.select_related("cohort").filter(token=token).first()
    if invitation is None:
        raise ValidationError({"token": "Invitation token is invalid."})
    if invitation.status != InvitationStatus.PENDING:
        raise ValidationError({"token": "Invitation is no longer pending."})
    if invitation.expires_at <= timezone.now():
        invitation.status = InvitationStatus.EXPIRED
        invitation.save(update_fields=["status"])
        raise ValidationError({"token": "Invitation has expired."})

    User = get_user_model()
    first_name, last_name = _split_name(invitation.email.split("@")[0].replace(".", " "))
    user, _ = User.objects.get_or_create(
        email=invitation.email,
        defaults={
            "username": invitation.email,
            "first_name": first_name,
            "last_name": last_name,
            "name": f"{first_name} {last_name}".strip() or invitation.email,
            "role": UserRole.STUDENT,
        },
    )
    user.set_password(password)
    user.role = UserRole.STUDENT
    user.status = UserStatus.ACTIVE
    user.cohort = invitation.cohort
    user.save()

    invitation.status = InvitationStatus.ACCEPTED
    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["status", "accepted_at"])
    return user
