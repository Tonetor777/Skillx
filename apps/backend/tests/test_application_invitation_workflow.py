from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from applications.models import Application, ApplicationStatus, Invitation, InvitationStatus
from cohorts.models import Cohort, CohortStatus
from programs.models import Program, ProgramStatus


pytestmark = pytest.mark.django_db


def create_user(email, role):
    User = get_user_model()
    return User.objects.create_user(
        username=email,
        email=email,
        password="password",
        first_name="Test",
        last_name="User",
        name="Test User",
        role=role,
        status=UserStatus.ACTIVE,
    )


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def domain():
    program = Program.objects.create(title="Admissions", slug="admissions", description="", status=ProgramStatus.ACTIVE)
    cohort = Cohort.objects.create(
        program=program,
        name="Admissions Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=12),
        status=CohortStatus.ACTIVE,
    )
    return program, cohort


def test_public_application_submission_accepts_contact_and_motivation_details():
    program, _ = domain()
    client = APIClient()

    response = client.post(
        "/api/applications/",
        {
            "first_name": "Grace",
            "last_name": "Hopper",
            "email": "grace@example.com",
            "phone": "+251000000",
            "country": "ET",
            "experience": "Intermediate",
            "motivation": "I want to join this cohort and build reliable software.",
            "program_id": str(program.id),
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["status"] == "pending"
    assert "resume_url" not in response.data
    assert "payment_proof_url" not in response.data


def test_invitation_accept_creates_student_and_prevents_reuse():
    program, cohort = domain()
    admin = create_user("admin-invite@example.com", UserRole.ADMIN)
    application = Application.objects.create(
        name="Ada Lovelace",
        email="ada-invite@example.com",
        phone="Not provided",
        country="Not provided",
        experience="Not provided",
        motivation="I want to build production systems.",
        program=program,
    )
    approve_response = auth_client(admin).post(f"/api/applications/{application.id}/approve/")
    invitation = Invitation.objects.get(email=application.email)

    accept_response = APIClient().post(
        f"/api/invitations/{invitation.token}/accept/",
        {"password": "student-password"},
        format="json",
    )
    reuse_response = APIClient().post(
        f"/api/invitations/{invitation.token}/accept/",
        {"password": "student-password"},
        format="json",
    )

    user = get_user_model().objects.get(email=application.email)
    invitation.refresh_from_db()
    assert approve_response.status_code == 200
    assert len(mail.outbox) == 1
    assert accept_response.status_code == 200
    assert reuse_response.status_code == 400
    assert user.role == UserRole.STUDENT
    assert user.status == UserStatus.ACTIVE
    assert user.cohort == cohort
    assert invitation.status == InvitationStatus.ACCEPTED


def test_expired_invitation_cannot_be_accepted_and_can_be_resent_or_revoked():
    _, cohort = domain()
    admin = create_user("admin-expired@example.com", UserRole.ADMIN)
    invitation = Invitation.objects.create(
        email="expired@example.com",
        cohort=cohort,
        token="expired-token",
        expires_at=timezone.now() - timedelta(hours=1),
    )

    expired_response = APIClient().post(
        f"/api/invitations/{invitation.token}/accept/",
        {"password": "student-password"},
        format="json",
    )
    invitation.refresh_from_db()
    invitation.status = InvitationStatus.PENDING
    invitation.expires_at = timezone.now() + timedelta(hours=1)
    invitation.save(update_fields=["status", "expires_at"])
    resend_response = auth_client(admin).post(f"/api/invitations/{invitation.id}/resend/")
    revoke_response = auth_client(admin).post(f"/api/invitations/{invitation.id}/revoke/")

    assert expired_response.status_code == 400
    assert resend_response.status_code == 200
    assert revoke_response.status_code == 200
    assert revoke_response.data["status"] == "revoked"
