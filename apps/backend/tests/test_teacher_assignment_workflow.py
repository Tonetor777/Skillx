from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from cohorts.models import Cohort, CohortStatus, TeacherAssignment
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


def create_cohort():
    program = Program.objects.create(title="Teachers", slug="teachers", description="", status=ProgramStatus.ACTIVE)
    return Cohort.objects.create(
        program=program,
        name="Teacher Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=12),
        status=CohortStatus.ACTIVE,
    )


def test_admin_can_assign_update_and_remove_teacher():
    admin = create_user("admin-teachers@example.com", UserRole.ADMIN)
    teacher = create_user("teacher-assigned@example.com", UserRole.TEACHER)
    cohort = create_cohort()
    client = auth_client(admin)

    create_response = client.post(
        "/api/teacher-assignments/",
        {"teacher_id": str(teacher.id), "cohort_id": str(cohort.id), "role": "LEAD"},
        format="json",
    )
    assignment_id = create_response.data["id"]
    update_response = client.patch(f"/api/teacher-assignments/{assignment_id}/", {"role": "MENTOR"}, format="json")
    delete_response = client.delete(f"/api/teacher-assignments/{assignment_id}/")

    assert create_response.status_code == 201
    assert create_response.data["role"] == "lead"
    assert update_response.status_code == 200
    assert update_response.data["role"] == "mentor"
    assert delete_response.status_code == 204
    assert TeacherAssignment.objects.count() == 0


def test_teacher_assignment_rejects_non_teacher_and_non_admin():
    admin = create_user("admin-reject@example.com", UserRole.ADMIN)
    teacher_user = create_user("teacher-noadmin@example.com", UserRole.TEACHER)
    student = create_user("student-not-teacher@example.com", UserRole.STUDENT)
    cohort = create_cohort()

    invalid_teacher_response = auth_client(admin).post(
        "/api/teacher-assignments/",
        {"teacher_id": str(student.id), "cohort_id": str(cohort.id), "role": "LEAD"},
        format="json",
    )
    teacher_admin_response = auth_client(teacher_user).post(
        "/api/teacher-assignments/",
        {"teacher_id": str(teacher_user.id), "cohort_id": str(cohort.id), "role": "LEAD"},
        format="json",
    )

    assert invalid_teacher_response.status_code == 400
    assert teacher_admin_response.status_code == 403
