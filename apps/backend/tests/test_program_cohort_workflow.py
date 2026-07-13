from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole
from programs.models import Program, ProgramStatus


pytestmark = pytest.mark.django_db


def create_user(email, role, *, cohort=None):
    User = get_user_model()
    return User.objects.create_user(
        username=email,
        email=email,
        password="password",
        first_name=email.split("@")[0],
        last_name="User",
        name=f"{email.split('@')[0]} User",
        role=role,
        status=UserStatus.ACTIVE,
        cohort=cohort,
    )


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def create_program(title="Program", status=ProgramStatus.ACTIVE):
    return Program.objects.create(
        title=title,
        slug=title.lower().replace(" ", "-"),
        description="A production program.",
        status=status,
    )


def create_cohort(program, name="July 2026", status=CohortStatus.ACTIVE):
    return Cohort.objects.create(
        program=program,
        name=name,
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=12),
        duration_weeks=12,
        current_week=1,
        status=status,
    )


def test_program_archive_soft_hides_from_default_list_but_detail_remains_available():
    admin = create_user("admin-program@example.com", UserRole.ADMIN)
    program = create_program("Archive Me")
    cohort = create_cohort(program)
    student = create_user("student-program@example.com", UserRole.STUDENT, cohort=cohort)
    client = auth_client(admin)

    archive_response = client.patch(f"/api/programs/{program.id}/archive/")
    list_response = client.get("/api/programs/")
    detail_response = client.get(f"/api/programs/{program.id}/")

    assert archive_response.status_code == 200
    assert archive_response.data["status"] == "archived"
    assert list_response.status_code == 200
    assert list_response.data == []
    assert detail_response.status_code == 200
    assert detail_response.data["cohorts"][0]["students_count"] == 1
    assert detail_response.data["cohorts"][0]["id"] == str(cohort.id)
    assert student.cohort_id == cohort.id


def test_cohort_status_and_current_week_are_validated():
    admin = create_user("admin-cohort@example.com", UserRole.ADMIN)
    program = create_program("Cohort Program")
    cohort = create_cohort(program)
    client = auth_client(admin)

    valid_response = client.patch(
        f"/api/cohorts/{cohort.id}/",
        {"status": "completed", "current_week": 12},
        format="json",
    )
    invalid_response = client.patch(
        f"/api/cohorts/{cohort.id}/",
        {"current_week": 13},
        format="json",
    )

    cohort.refresh_from_db()
    assert valid_response.status_code == 200
    assert valid_response.data["status"] == "completed"
    assert cohort.status == CohortStatus.COMPLETED
    assert cohort.current_week == 12
    assert invalid_response.status_code == 400


def test_teacher_and_student_cohort_scoping_is_preserved():
    teacher = create_user("teacher-scope@example.com", UserRole.TEACHER)
    student_program = create_program("Student Program")
    other_program = create_program("Other Program")
    student_cohort = create_cohort(student_program, "Student Cohort")
    teacher_cohort = create_cohort(other_program, "Teacher Cohort")
    hidden_cohort = create_cohort(other_program, "Hidden Cohort")
    student = create_user("student-scope@example.com", UserRole.STUDENT, cohort=student_cohort)
    TeacherAssignment.objects.create(teacher=teacher, cohort=teacher_cohort, role=TeacherAssignmentRole.LEAD)

    teacher_response = auth_client(teacher).get("/api/cohorts/")
    student_response = auth_client(student).get("/api/cohorts/")

    assert [item["id"] for item in teacher_response.data] == [str(teacher_cohort.id)]
    assert [item["id"] for item in student_response.data] == [str(student_cohort.id)]
    assert str(hidden_cohort.id) not in [item["id"] for item in teacher_response.data]


def test_student_program_access_is_limited_to_enrolled_cohort_program():
    enrolled_program = create_program("Enrolled Program")
    other_program = create_program("Other Active Program")
    cohort = create_cohort(enrolled_program, "Student Cohort")
    student = create_user("student-program-scope@example.com", UserRole.STUDENT, cohort=cohort)
    client = auth_client(student)

    list_response = client.get("/api/programs/")
    enrolled_detail_response = client.get(f"/api/programs/{enrolled_program.id}/")
    other_detail_response = client.get(f"/api/programs/{other_program.id}/")

    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.data] == [str(enrolled_program.id)]
    assert enrolled_detail_response.status_code == 200
    assert other_detail_response.status_code == 404


def test_public_program_catalog_lists_only_active_signup_options():
    active_program = create_program("Active Signup Program", ProgramStatus.ACTIVE)
    archived_program = create_program("Archived Signup Program", ProgramStatus.ARCHIVED)
    client = APIClient()

    response = client.get("/api/programs/public/")

    returned_ids = [item["id"] for item in response.data]
    assert response.status_code == 200
    assert str(active_program.id) in returned_ids
    assert str(archived_program.id) not in returned_ids
