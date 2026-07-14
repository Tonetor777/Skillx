from datetime import timedelta
from io import BytesIO

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from applications.models import Application, ApplicationStatus, Invitation
from announcements.models import Announcement
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole
from learning.models import Assignment, Lesson, Module, ModuleStatus, Resource
from programs.models import Program, ProgramStatus
from submissions.models import Submission


pytestmark = pytest.mark.django_db

def png_file(name: str):
    buffer = BytesIO()
    Image.new("RGB", (1, 1), color="white").save(buffer, format="PNG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/png")


def create_user(email, role, *, cohort=None, status=UserStatus.ACTIVE, password="password"):
    User = get_user_model()
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=email.split("@")[0].title(),
        last_name="User",
        name=f"{email.split('@')[0].title()} User",
        role=role,
        status=status,
        cohort=cohort,
    )
    return user


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def domain():
    super_admin = create_user("superadmin@example.com", UserRole.SUPER_ADMIN)
    admin = create_user("admin@example.com", UserRole.ADMIN)
    teacher = create_user("teacher@example.com", UserRole.TEACHER)
    program = Program.objects.create(
        title="React Engineering",
        slug="react-engineering",
        description="A practical full-stack program.",
        syllabus=[],
        status=ProgramStatus.ACTIVE,
    )
    cohort = Cohort.objects.create(
        program=program,
        name="July 2026",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=12),
        status=CohortStatus.ACTIVE,
    )
    TeacherAssignment.objects.create(teacher=teacher, cohort=cohort, role=TeacherAssignmentRole.LEAD)
    student = create_user("student@example.com", UserRole.STUDENT, cohort=cohort)
    module = Module.objects.create(
        cohort=cohort,
        module_number=1,
        title="Foundations",
        status=ModuleStatus.PUBLISHED,
        created_by=teacher,
    )
    lesson = Lesson.objects.create(module=module, title="First Lesson", order=1)
    assignment = Assignment.objects.create(
        cohort=cohort,
        module=module,
        lesson=lesson,
        title="First Build",
        description="Submit a link.",
        max_points=100,
        due_date=timezone.now() + timedelta(days=7),
        created_by=teacher,
    )
    return {
        "super_admin": super_admin,
        "admin": admin,
        "teacher": teacher,
        "program": program,
        "cohort": cohort,
        "student": student,
        "assignment": assignment,
    }


def test_active_token_returns_frontend_user_dto(domain):
    client = APIClient()
    response = client.post("/api/auth/token/", {"email": "student@example.com", "password": "password"}, format="json")

    assert response.status_code == 200
    assert response.data["access"]
    assert response.data["refresh"]
    assert response.data["user"]["role"] == "student"
    assert response.data["user"]["cohort_id"] == str(domain["cohort"].id)


def test_inactive_user_cannot_log_in():
    create_user("inactive@example.com", UserRole.STUDENT, status=UserStatus.SUSPENDED)
    client = APIClient()

    response = client.post("/api/auth/token/", {"email": "inactive@example.com", "password": "password"}, format="json")

    assert response.status_code == 400


def test_program_and_cohort_endpoints_emit_ui_dtos(domain):
    client = auth_client(domain["admin"])

    program_response = client.get("/api/programs/")
    cohort_response = client.get("/api/cohorts/")

    assert program_response.status_code == 200
    assert program_response.data[0]["name"] == "React Engineering"
    assert "weeks" in program_response.data[0]
    assert cohort_response.status_code == 200
    assert cohort_response.data[0]["program_name"] == "React Engineering"
    assert cohort_response.data[0]["students_count"] == 1
    assert cohort_response.data[0]["teachers"][0]["role"] == "teacher"


def test_profile_update_accepts_json_and_photo_upload(domain):
    client = auth_client(domain["student"])

    json_response = client.patch(
        "/api/accounts/me/",
        {"first_name": "Updated", "last_name": "Student"},
        format="json",
    )
    photo = png_file("avatar.png")
    photo_response = client.patch("/api/accounts/me/", {"photo": photo}, format="multipart")

    assert json_response.status_code == 200
    assert json_response.data["first_name"] == "Updated"
    assert photo_response.status_code == 200
    assert photo_response.data["avatar_url"]


def test_profile_photo_upload_validation_and_authentication(domain):
    invalid = SimpleUploadedFile("avatar.txt", b"not an image", content_type="text/plain")
    anonymous_response = APIClient().patch("/api/accounts/me/", {"photo": invalid}, format="multipart")
    invalid_response = auth_client(domain["student"]).patch("/api/accounts/me/", {"photo": invalid}, format="multipart")

    assert anonymous_response.status_code == 401
    assert invalid_response.status_code == 400
    assert "photo" in invalid_response.data


def test_program_thumbnail_upload_and_permissions(domain):
    admin_client = auth_client(domain["admin"])
    student_client = auth_client(domain["student"])
    thumbnail = png_file("thumbnail.png")
    blocked_thumbnail = png_file("blocked.png")

    create_response = admin_client.post(
        "/api/programs/",
        {
            "name": "Media Program",
            "description": "A program with a thumbnail image.",
            "weeks": "[]",
            "thumbnail": thumbnail,
        },
        format="multipart",
    )
    program_id = create_response.data["id"]
    forbidden_response = student_client.patch(
        f"/api/programs/{program_id}/",
        {"thumbnail": blocked_thumbnail},
        format="multipart",
    )

    assert create_response.status_code == 201
    assert create_response.data["thumbnail_url"]
    assert forbidden_response.status_code == 403


def test_application_approval_is_super_admin_only_and_creates_invitation(domain):
    application = Application.objects.create(
        name="Ada Lovelace",
        email="ada@example.com",
        phone="Not provided",
        country="Not provided",
        experience="Not provided",
        motivation="I want to build production systems.",
        program=domain["program"],
    )

    teacher_response = auth_client(domain["teacher"]).post(f"/api/applications/{application.id}/approve/")
    admin_response = auth_client(domain["admin"]).post(f"/api/applications/{application.id}/approve/")
    super_admin_response = auth_client(domain["super_admin"]).post(f"/api/applications/{application.id}/approve/")

    application.refresh_from_db()
    assert teacher_response.status_code == 403
    assert admin_response.status_code == 403
    assert super_admin_response.status_code == 200
    assert application.status == ApplicationStatus.APPROVED
    assert Invitation.objects.get(email="ada@example.com").cohort == domain["cohort"]
    assert len(mail.outbox) == 1
    assert super_admin_response.data["reviewed_by_name"]


def test_student_only_sees_own_cohort_assignments(domain):
    other_program = Program.objects.create(title="Other", slug="other", description="", status=ProgramStatus.ACTIVE)
    other_cohort = Cohort.objects.create(
        program=other_program,
        name="Other Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=4),
        status=CohortStatus.ACTIVE,
    )
    other_module = Module.objects.create(cohort=other_cohort, module_number=1, title="Other Module", created_by=domain["teacher"])
    other_lesson = Lesson.objects.create(module=other_module, title="Other Lesson", order=1)
    Assignment.objects.create(
        cohort=other_cohort,
        module=other_module,
        lesson=other_lesson,
        title="Hidden",
        description="Hidden",
        max_points=100,
        due_date=timezone.now() + timedelta(days=1),
        created_by=domain["teacher"],
    )

    response = auth_client(domain["student"]).get("/api/assignments/")

    assert response.status_code == 200
    assert [item["title"] for item in response.data] == ["First Build"]


def test_teacher_can_create_and_edit_assignment_from_lesson_scope(domain):
    client = auth_client(domain["teacher"])
    module = Module.objects.create(
        cohort=domain["cohort"],
        module_number=2,
        title="Advanced Foundations",
        status=ModuleStatus.PUBLISHED,
        created_by=domain["teacher"],
    )
    lesson = Lesson.objects.create(module=module, title="Scoped Lesson", order=1)

    create_response = client.post(
        "/api/assignments/",
        {
            "title": "Scoped Build",
            "description": "Build against the selected lesson.",
            "max_points": 50,
            "due_date": (timezone.now() + timedelta(days=5)).isoformat(),
            "lesson_id": str(lesson.id),
        },
        format="json",
    )
    assignment = Assignment.objects.get(title="Scoped Build")
    update_response = client.patch(
        f"/api/assignments/{assignment.id}/",
        {"title": "Updated Scoped Build", "max_points": 75},
        format="json",
    )

    assignment.refresh_from_db()
    assert create_response.status_code == 201
    assert create_response.data["cohort_id"] == str(domain["cohort"].id)
    assert create_response.data["module_id"] == str(module.id)
    assert assignment.created_by == domain["teacher"]
    assert update_response.status_code == 200
    assert assignment.title == "Updated Scoped Build"
    assert assignment.max_points == 75


def test_assignment_resource_must_match_selected_lesson(domain):
    module = Module.objects.create(
        cohort=domain["cohort"],
        module_number=2,
        title="Resource Module",
        status=ModuleStatus.PUBLISHED,
        created_by=domain["teacher"],
    )
    lesson = Lesson.objects.create(module=module, title="Resource Lesson", order=1)
    resource = Resource.objects.create(lesson=lesson, title="Reference", url="https://example.com/reference", order=1)

    response = auth_client(domain["teacher"]).patch(
        f"/api/assignments/{domain['assignment'].id}/",
        {"resource_id": str(resource.id)},
        format="json",
    )

    assert response.status_code == 400
    assert "resource_id" in response.data


def test_assignment_delete_removes_empty_assignment(domain):
    assignment = Assignment.objects.create(
        cohort=domain["cohort"],
        module=domain["assignment"].module,
        lesson=domain["assignment"].lesson,
        title="Disposable",
        description="No submissions yet.",
        max_points=100,
        due_date=timezone.now() + timedelta(days=1),
        created_by=domain["teacher"],
    )

    response = auth_client(domain["teacher"]).delete(f"/api/assignments/{assignment.id}/")

    assert response.status_code == 204
    assert not Assignment.objects.filter(id=assignment.id).exists()


def test_assignment_delete_locks_when_submissions_exist(domain):
    submission = Submission.objects.create(
        assignment=domain["assignment"],
        student=domain["student"],
        primary_link="https://example.com/submission",
    )

    response = auth_client(domain["teacher"]).delete(f"/api/assignments/{domain['assignment'].id}/")

    domain["assignment"].refresh_from_db()
    assert response.status_code == 200
    assert response.data["is_locked"] is True
    assert domain["assignment"].is_locked is True
    assert Submission.objects.filter(id=submission.id).exists()


def test_assignment_management_permissions_respect_teacher_scope(domain):
    other_teacher = create_user("other-teacher@example.com", UserRole.TEACHER)
    student_client = auth_client(domain["student"])
    other_teacher_client = auth_client(other_teacher)

    student_update = student_client.patch(f"/api/assignments/{domain['assignment'].id}/", {"title": "Blocked"}, format="json")
    student_delete = student_client.delete(f"/api/assignments/{domain['assignment'].id}/")
    teacher_update = other_teacher_client.patch(f"/api/assignments/{domain['assignment'].id}/", {"title": "Blocked"}, format="json")
    teacher_delete = other_teacher_client.delete(f"/api/assignments/{domain['assignment'].id}/")

    assert student_update.status_code == 403
    assert student_delete.status_code == 403
    assert teacher_update.status_code == 404
    assert teacher_delete.status_code == 404


def test_locked_assignment_rejects_student_submissions(domain):
    domain["assignment"].is_locked = True
    domain["assignment"].save(update_fields=["is_locked"])

    new_submission_response = auth_client(domain["student"]).post(
        "/api/submissions/",
        {"assignment_id": str(domain["assignment"].id), "content": "https://example.com/submission"},
        format="json",
    )
    Submission.objects.create(
        assignment=domain["assignment"],
        student=domain["student"],
        primary_link="https://example.com/original",
    )
    resubmit_response = auth_client(domain["student"]).post(
        "/api/submissions/",
        {"assignment_id": str(domain["assignment"].id), "content": "https://example.com/resubmission"},
        format="json",
    )

    assert new_submission_response.status_code == 400
    assert resubmit_response.status_code == 400
    assert Submission.objects.get().primary_link == "https://example.com/original"


def test_submission_create_and_grade_permissions(domain):
    student_client = auth_client(domain["student"])
    teacher_client = auth_client(domain["teacher"])

    create_response = student_client.post(
        "/api/submissions/",
        {"assignment_id": str(domain["assignment"].id), "content": "https://example.com/submission"},
        format="json",
    )
    submission = Submission.objects.get()
    student_grade_response = student_client.post(
        f"/api/submissions/{submission.id}/grade/",
        {"grade": 90, "feedback": "Strong work."},
        format="json",
    )
    teacher_grade_response = teacher_client.post(
        f"/api/submissions/{submission.id}/grade/",
        {"grade": 90, "feedback": "Strong work."},
        format="json",
    )

    submission.refresh_from_db()
    assert create_response.status_code == 201
    assert student_grade_response.status_code == 403
    assert teacher_grade_response.status_code == 200
    assert teacher_grade_response.data["status"] == "graded"
    assert submission.is_locked is True


def test_announcements_and_settings_permissions(domain):
    Announcement.objects.create(
        title="Cohort Update",
        message="Welcome to the cohort.",
        cohort=domain["cohort"],
        created_by=domain["admin"],
    )
    student_client = auth_client(domain["student"])
    admin_client = auth_client(domain["admin"])
    super_admin = create_user("super@example.com", UserRole.SUPER_ADMIN)
    super_client = auth_client(super_admin)

    announcements = student_client.get("/api/announcements/")
    admin_settings_update = admin_client.patch("/api/settings/", {"branding_name": "Nope", "theme": "slate"}, format="json")
    super_settings_update = super_client.patch("/api/settings/", {"branding_name": "Skilix Academy", "theme": "slate"}, format="json")

    assert announcements.status_code == 200
    assert announcements.data[0]["target_type"] == "cohort"
    assert admin_settings_update.status_code == 403
    assert super_settings_update.status_code == 200
    assert super_settings_update.data["branding_name"] == "Skilix Academy"
