from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from applications.models import Application, ApplicationStatus, ExperienceLevel, Invitation, InvitationStatus
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


def test_public_application_submission_accepts_signup_profile_and_expectations_details():
    program, _ = domain()
    client = APIClient()

    response = client.post(
        "/api/applications/",
        {
            "first_name": "Grace",
            "last_name": "Hopper",
            "email": "grace@example.com",
            "phone": "+251000000",
            "age": 28,
            "experience": ExperienceLevel.INTERMEDIATE,
            "expectations": "I expect mentor support, structured projects, and a clear path into reliable software delivery.",
            "program_id": str(program.id),
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.data["status"] == "pending"
    assert response.data["age"] == 28
    assert response.data["experience"] == ExperienceLevel.INTERMEDIATE
    assert "country" not in response.data
    assert "motivation" not in response.data
    assert "resume_url" not in response.data
    assert "payment_proof_url" not in response.data


def test_public_application_submission_requires_valid_experience_choice():
    program, _ = domain()
    client = APIClient()

    response = client.post(
        "/api/applications/",
        {
            "first_name": "Grace",
            "last_name": "Hopper",
            "email": "invalid-experience@example.com",
            "phone": "+251000000",
            "age": 28,
            "experience": "LEARNING_A_BIT",
            "expectations": "I expect mentor support and structured projects throughout the program.",
            "program_id": str(program.id),
        },
        format="json",
    )

    assert response.status_code == 400
    assert "experience" in response.data


def test_public_application_submission_requires_active_existing_program():
    active_program, _ = domain()
    archived_program = Program.objects.create(
        title="Archived Admissions",
        slug="archived-admissions",
        description="",
        status=ProgramStatus.ARCHIVED,
    )
    client = APIClient()
    payload = {
        "first_name": "Grace",
        "last_name": "Hopper",
        "email": "program-validation@example.com",
        "phone": "+251000000",
        "age": 28,
        "experience": ExperienceLevel.INTERMEDIATE,
        "expectations": "I expect mentor support and structured projects throughout the program.",
    }

    missing_response = client.post("/api/applications/", payload, format="json")
    invalid_response = client.post(
        "/api/applications/",
        {**payload, "email": "invalid-program@example.com", "program_id": "not-a-program"},
        format="json",
    )
    archived_response = client.post(
        "/api/applications/",
        {**payload, "email": "archived-program@example.com", "program_id": str(archived_program.id)},
        format="json",
    )
    valid_response = client.post(
        "/api/applications/",
        {**payload, "email": "active-program@example.com", "program_id": str(active_program.id)},
        format="json",
    )

    assert missing_response.status_code == 400
    assert invalid_response.status_code == 400
    assert archived_response.status_code == 400
    assert valid_response.status_code == 201
    assert "program_id" in missing_response.data
    assert "program_id" in invalid_response.data
    assert "program_id" in archived_response.data


def test_invitation_accept_creates_student_and_prevents_reuse():
    program, cohort = domain()
    super_admin = create_user("super-admin-invite@example.com", UserRole.SUPER_ADMIN)
    application = Application.objects.create(
        name="Ada Lovelace",
        email="ada-invite@example.com",
        phone="Not provided",
        age=30,
        experience=ExperienceLevel.BEGINNER,
        expectations="I want to build production systems.",
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
        {"password": "student-password", "confirm_password": "student-password"},
        format="json",
    )
    login_after_acceptance = APIClient().post(
        "/api/auth/token/",
        {"email": application.email, "password": "student-password"},
        format="json",
    )
    reuse_response = APIClient().post(
        f"/api/invitations/{invitation.token}/accept/",
        {"password": "student-password", "confirm_password": "student-password"},
        format="json",
    )

    user = get_user_model().objects.get(email=application.email)
    invitation.refresh_from_db()
    assert approve_response.status_code == 200
    assert len(mail.outbox) == 1
    assert "Your Nexus Academy invitation" in mail.outbox[0].subject
    assert "Accept your invitation and set your password" in mail.outbox[0].body
    assert "Accept invitation" in mail.outbox[0].alternatives[0][0]
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


def test_invitation_accept_rejects_existing_staff_account_without_changes():
    _, cohort = domain()
    staff = create_user("staff-invited@example.com", UserRole.ADMIN)
    invitation = Invitation.objects.create(
        email=staff.email,
        cohort=cohort,
        token="staff-invite-token",
        expires_at=timezone.now() + timedelta(hours=1),
    )

    response = APIClient().post(
        f"/api/invitations/{invitation.token}/accept/",
        {"password": "student-password", "confirm_password": "student-password"},
        format="json",
    )

    staff.refresh_from_db()
    invitation.refresh_from_db()
    assert response.status_code == 400
    assert staff.role == UserRole.ADMIN
    assert staff.status == UserStatus.ACTIVE
    assert staff.cohort_id is None
    assert staff.check_password("password")
    assert invitation.status == InvitationStatus.PENDING
    assert invitation.accepted_at is None


def test_admin_and_super_admin_can_review_signup_applications():
    program, cohort = domain()
    admin = create_user("admin-review@example.com", UserRole.ADMIN)
    super_admin = create_user("super-admin-review@example.com", UserRole.SUPER_ADMIN)
    teacher = create_user("teacher-review@example.com", UserRole.TEACHER)
    application = Application.objects.create(
        name="Katherine Johnson",
        email="katherine@example.com",
        phone="Not provided",
        age=32,
        experience=ExperienceLevel.ADVANCED,
        expectations="I want to learn software delivery.",
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


def test_admin_can_reinvite_approved_application_with_expired_link():
    program, cohort = domain()
    admin = create_user("admin-reinvite@example.com", UserRole.ADMIN)
    application = Application.objects.create(
        name="Dorothy Vaughan",
        email="dorothy@example.com",
        phone="Not provided",
        age=35,
        experience=ExperienceLevel.INTERMEDIATE,
        expectations="I want a fresh path into software delivery.",
        program=program,
        status=ApplicationStatus.APPROVED,
        reviewed_by=admin,
        reviewed_at=timezone.now(),
    )
    expired_invitation = Invitation.objects.create(
        email=application.email,
        cohort=cohort,
        token="expired-application-token",
        expires_at=timezone.now() - timedelta(hours=1),
    )

    response = auth_client(admin).post(f"/api/applications/{application.id}/reinvite/")

    expired_invitation.refresh_from_db()
    fresh_invitation = Invitation.objects.exclude(id=expired_invitation.id).get(email=application.email)
    assert response.status_code == 200
    assert response.data["status"] == "approved"
    assert expired_invitation.status == InvitationStatus.REVOKED
    assert fresh_invitation.status == InvitationStatus.PENDING
    assert fresh_invitation.cohort == cohort
    assert fresh_invitation.expires_at > timezone.now()
    assert len(mail.outbox) == 1


def test_reinvite_refuses_accepted_invitation():
    program, cohort = domain()
    admin = create_user("admin-reinvite-accepted@example.com", UserRole.ADMIN)
    application = Application.objects.create(
        name="Mary Jackson",
        email="mary@example.com",
        phone="Not provided",
        age=34,
        experience=ExperienceLevel.ADVANCED,
        expectations="I want to grow into engineering leadership.",
        program=program,
        status=ApplicationStatus.APPROVED,
        reviewed_by=admin,
        reviewed_at=timezone.now(),
    )
    Invitation.objects.create(
        email=application.email,
        cohort=cohort,
        token="accepted-application-token",
        expires_at=timezone.now() + timedelta(hours=12),
        status=InvitationStatus.ACCEPTED,
        accepted_at=timezone.now(),
    )

    response = auth_client(admin).post(f"/api/applications/{application.id}/reinvite/")

    assert response.status_code == 400
    assert Invitation.objects.filter(email=application.email).count() == 1
    assert len(mail.outbox) == 0


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
            age=25,
            experience=ExperienceLevel.BEGINNER,
            expectations="I want to learn software delivery.",
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
        {"password": "student-password", "confirm_password": "student-password"},
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


def test_invitation_accept_rejects_mismatched_password_confirmation():
    _, cohort = domain()
    invitation = Invitation.objects.create(
        email="mismatch-invite@example.com",
        cohort=cohort,
        token="mismatch-token",
        expires_at=timezone.now() + timedelta(hours=1),
    )

    response = APIClient().post(
        f"/api/invitations/{invitation.token}/accept/",
        {"password": "student-password", "confirm_password": "different-password"},
        format="json",
    )

    invitation.refresh_from_db()
    assert response.status_code == 400
    assert "confirm_password" in response.data
    assert invitation.status == InvitationStatus.PENDING
    assert not get_user_model().objects.filter(email=invitation.email).exists()
