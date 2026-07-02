from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole
from learning.models import Resource, Week, WeekStatus
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


def test_teacher_can_create_publish_and_student_can_view_published_week():
    teacher, student, cohort = domain()
    teacher_client = auth_client(teacher)

    create_response = teacher_client.post(
        "/api/weeks/",
        {
            "cohort_id": str(cohort.id),
            "week_number": 1,
            "title": "Foundations",
            "objectives": "Learn the basics.",
            "status": "draft",
        },
        format="json",
    )
    week_id = create_response.data["id"]
    hidden_student_response = auth_client(student).get("/api/weeks/")
    publish_response = teacher_client.post(f"/api/weeks/{week_id}/publish/")
    visible_student_response = auth_client(student).get("/api/weeks/")

    assert create_response.status_code == 201
    assert hidden_student_response.data == []
    assert publish_response.status_code == 200
    assert publish_response.data["status"] == "published"
    assert publish_response.data["publish_date"]
    assert publish_response.data["published_by_name"]
    assert [item["id"] for item in visible_student_response.data] == [week_id]


def test_resource_crud_ordering_and_delete():
    teacher, _, cohort = domain()
    week = Week.objects.create(cohort=cohort, week_number=1, title="Resources", created_by=teacher)
    client = auth_client(teacher)

    first = client.post(
        "/api/resources/",
        {"week_id": str(week.id), "title": "Second", "url": "https://example.com/2", "order": 2},
        format="json",
    )
    second = client.post(
        "/api/resources/",
        {"week_id": str(week.id), "title": "First", "url": "https://example.com/1", "order": 1},
        format="json",
    )
    list_response = client.get(f"/api/resources/?week_id={week.id}")
    delete_response = client.delete(f"/api/resources/{first.data['id']}/")

    assert first.status_code == 201
    assert second.status_code == 201
    assert [item["title"] for item in list_response.data] == ["First", "Second"]
    assert delete_response.status_code == 204
    assert Resource.objects.count() == 1
