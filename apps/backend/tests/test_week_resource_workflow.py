from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole
from learning.models import Lesson, Module, ModuleStatus, Resource
from programs.models import Program, ProgramStatus


pytestmark = pytest.mark.django_db


def create_user(email, role, *, cohort=None):
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
        cohort=cohort,
    )


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def domain():
    teacher = create_user("teacher-weeks@example.com", UserRole.TEACHER)
    program = Program.objects.create(title="Weeks", slug="weeks", description="", status=ProgramStatus.ACTIVE)
    cohort = Cohort.objects.create(
        program=program,
        name="Weeks Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=12),
        status=CohortStatus.ACTIVE,
    )
    TeacherAssignment.objects.create(teacher=teacher, cohort=cohort, role=TeacherAssignmentRole.LEAD)
    student = create_user("student-weeks@example.com", UserRole.STUDENT, cohort=cohort)
    return teacher, student, cohort


def test_teacher_can_create_publish_and_student_can_view_published_module():
    teacher, student, cohort = domain()
    teacher_client = auth_client(teacher)

    create_response = teacher_client.post(
        "/api/modules/",
        {
            "cohort_id": str(cohort.id),
            "module_number": 1,
            "title": "Foundations",
            "description": "Learn the basics.",
            "status": "draft",
        },
        format="json",
    )
    module_id = create_response.data["id"]
    lesson_response = teacher_client.post(
        "/api/lessons/",
        {"module_id": module_id, "title": "Intro", "objectives": "Start well.", "order": 1},
        format="json",
    )
    hidden_student_response = auth_client(student).get("/api/modules/")
    publish_response = teacher_client.post(f"/api/modules/{module_id}/publish/")
    visible_student_response = auth_client(student).get("/api/modules/")

    assert create_response.status_code == 201
    assert lesson_response.status_code == 201
    assert hidden_student_response.data == []
    assert publish_response.status_code == 200
    assert publish_response.data["status"] == "published"
    assert publish_response.data["publish_date"]
    assert publish_response.data["published_by_name"]
    assert [item["id"] for item in visible_student_response.data] == [module_id]
    assert visible_student_response.data[0]["lessons"][0]["title"] == "Intro"


def test_resource_crud_ordering_and_delete():
    teacher, _, cohort = domain()
    module = Module.objects.create(cohort=cohort, module_number=1, title="Resources", status=ModuleStatus.PUBLISHED, created_by=teacher)
    lesson = Lesson.objects.create(module=module, title="Links", order=1)
    client = auth_client(teacher)

    first = client.post(
        "/api/resources/",
        {"lesson_id": str(lesson.id), "title": "Second", "url": "https://example.com/2", "order": 2},
        format="json",
    )
    second = client.post(
        "/api/resources/",
        {"lesson_id": str(lesson.id), "title": "First", "url": "https://example.com/1", "order": 1},
        format="json",
    )
    list_response = client.get(f"/api/resources/?lesson_id={lesson.id}")
    delete_response = client.delete(f"/api/resources/{first.data['id']}/")

    assert first.status_code == 201
    assert second.status_code == 201
    assert [item["title"] for item in list_response.data] == ["First", "Second"]
    assert delete_response.status_code == 204
    assert Resource.objects.count() == 1


def test_lesson_content_accepts_and_returns_serialized_editor_document():
    teacher, _, cohort = domain()
    module = Module.objects.create(cohort=cohort, module_number=1, title="Editor", status=ModuleStatus.DRAFT, created_by=teacher)
    client = auth_client(teacher)
    editor_document = '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Native Lesson"}]},{"type":"paragraph","content":[{"type":"text","text":"Students read this inline."}]}]}'

    response = client.post(
        "/api/lessons/",
        {
            "module_id": str(module.id),
            "title": "Rich content",
            "objectives": "Read inside Skilix.",
            "content": editor_document,
            "order": 1,
        },
        format="json",
    )
    detail_response = client.get(f"/api/lessons/?module_id={module.id}")

    assert response.status_code == 201
    assert response.data["content"] == editor_document
    assert detail_response.data[0]["content"] == editor_document
