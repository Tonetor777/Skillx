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
    super_admin = create_user("super-admin-invite@example.com", UserRole.SUPER_ADMIN)
    application = Application.objects.create(
        name="Ada Lovelace",
        email="ada-invite@example.com",
        phone="Not provided",
        country="Not provided",
        experience="Not provided",
        motivation="I want to build production systems.",
        program=program,
    )
    approve_response = auth_client(super_admin).post(
        f"/api/applications/{application.id}/approve/",
        {"cohort_id": str(cohort.id)},
        format="json",
    )
    invitation = Invitation.objects.get(email=application.email)
    users_before_acceptance = get_user_model().objects.filter(email=application.email).count()
    login_before_acceptance = APIClient().post(
        "/api/auth/token/",
        {"email": application.email, "password": "student-password"},
        format="json",
    )

    accept_response = APIClient().post(
        f"/api/invitations/{invitation.token}/accept/",
        {"password": "student-password"},
        format="json",
    )
    login_after_acceptance = APIClient().post(
        "/api/auth/token/",
        {"email": application.email, "password": "student-password"},
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
    assert users_before_acceptance == 0
    assert get_user_model().objects.filter(email=application.email).count() == 1
    assert login_before_acceptance.status_code == 401
    assert accept_response.status_code == 200
    assert login_after_acceptance.status_code == 200
    assert reuse_response.status_code == 400
    assert user.role == UserRole.STUDENT
    assert user.status == UserStatus.ACTIVE
    assert user.cohort == cohort
    assert invitation.status == InvitationStatus.ACCEPTED


def test_admin_and_super_admin_can_review_signup_applications():
    program, cohort = domain()
    admin = create_user("admin-review@example.com", UserRole.ADMIN)
    super_admin = create_user("super-admin-review@example.com", UserRole.SUPER_ADMIN)
    teacher = create_user("teacher-review@example.com", UserRole.TEACHER)
    application = Application.objects.create(
        name="Katherine Johnson",
        email="katherine@example.com",
        phone="Not provided",
        country="Not provided",
        experience="Not provided",
        motivation="I want to learn software delivery.",
        program=program,
    )

    admin_list_response = auth_client(admin).get("/api/applications/")
    teacher_list_response = auth_client(teacher).get("/api/applications/")
    admin_approve_response = auth_client(admin).post(
        f"/api/applications/{application.id}/approve/",
        {"cohort_id": str(cohort.id)},
        format="json",
    )
    super_admin_list_response = auth_client(super_admin).get("/api/applications/")

    application.refresh_from_db()
    assert admin_list_response.status_code == 200
    assert teacher_list_response.status_code == 403
    assert super_admin_list_response.status_code == 200
    assert admin_approve_response.status_code == 200
    assert application.status == ApplicationStatus.APPROVED
    assert Invitation.objects.filter(email=application.email, status=InvitationStatus.PENDING).exists()


def test_application_approval_requires_valid_open_cohort_for_selected_program():
    program, cohort = domain()
    other_program = Program.objects.create(title="Other Admissions", slug="other-admissions", description="", status=ProgramStatus.ACTIVE)
    other_cohort = Cohort.objects.create(
        program=other_program,
        name="Other Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=12),
        status=CohortStatus.ACTIVE,
    )
    closed_cohort = Cohort.objects.create(
        program=program,
        name="Closed Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=12),
        status=CohortStatus.COMPLETED,
    )
    admin = create_user("admin-invalid-cohort@example.com", UserRole.ADMIN)
    client = auth_client(admin)

    def create_application(email):
        return Application.objects.create(
            name="Invalid Cohort",
            email=email,
            phone="Not provided",
            country="Not provided",
            experience="Not provided",
            motivation="I want to learn software delivery.",
            program=program,
        )

    missing_response = client.post(f"/api/applications/{create_application('missing@example.com').id}/approve/", {}, format="json")
    wrong_program_response = client.post(
        f"/api/applications/{create_application('wrong@example.com').id}/approve/",
        {"cohort_id": str(other_cohort.id)},
        format="json",
    )
    closed_response = client.post(
        f"/api/applications/{create_application('closed@example.com').id}/approve/",
        {"cohort_id": str(closed_cohort.id)},
        format="json",
    )
    valid_response = client.post(
        f"/api/applications/{create_application('valid@example.com').id}/approve/",
        {"cohort_id": str(cohort.id)},
        format="json",
    )

    assert missing_response.status_code == 400
    assert wrong_program_response.status_code == 400
    assert closed_response.status_code == 400
    assert valid_response.status_code == 200
    assert Invitation.objects.get(email="valid@example.com").cohort == cohort


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
