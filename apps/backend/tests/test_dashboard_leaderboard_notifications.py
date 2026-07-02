from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from announcements.models import Announcement
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole
from learning.models import Assignment, Week, WeekStatus
from programs.models import Program, ProgramStatus
from submissions.models import Submission


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


@pytest.fixture
def domain():
    admin = create_user("admin-final@example.com", UserRole.ADMIN)
    teacher = create_user("teacher-final@example.com", UserRole.TEACHER)
    program = Program.objects.create(title="Final", slug="final", description="", status=ProgramStatus.ACTIVE)
    cohort = Cohort.objects.create(
        program=program,
        name="Final Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=12),
        status=CohortStatus.ACTIVE,
    )
    TeacherAssignment.objects.create(teacher=teacher, cohort=cohort, role=TeacherAssignmentRole.LEAD)
    student = create_user("student-final@example.com", UserRole.STUDENT, cohort=cohort)
    week = Week.objects.create(cohort=cohort, week_number=1, title="Final Week", status=WeekStatus.PUBLISHED, created_by=teacher)
    assignment = Assignment.objects.create(
        cohort=cohort,
        week=week,
        title="Final Assignment",
        description="Submit work.",
        max_points=100,
        due_date=timezone.now() + timedelta(days=1),
        week_number=1,
        created_by=teacher,
    )
    submission = Submission.objects.create(assignment=assignment, student=student, primary_link="https://example.com")
    return admin, teacher, student, cohort, assignment, submission


def test_grading_sends_email_notification(domain):
    _, teacher, _, _, _, submission = domain

    response = auth_client(teacher).post(
        f"/api/submissions/{submission.id}/grade/",
        {"grade": 95, "feedback": "Excellent final submission."},
        format="json",
    )

    assert response.status_code == 200
    assert len(mail.outbox) == 1
    assert "was graded" in mail.outbox[0].subject


def test_scheduled_announcement_is_hidden_until_due(domain):
    admin, _, student, cohort, _, _ = domain
    Announcement.objects.create(
        title="Future",
        message="Later",
        cohort=cohort,
        created_by=admin,
        scheduled_for=timezone.now() + timedelta(days=1),
    )
    Announcement.objects.create(title="Now", message="Ready", cohort=cohort, created_by=admin)

    response = auth_client(student).get("/api/announcements/")

    assert response.status_code == 200
    assert [item["title"] for item in response.data] == ["Now"]


def test_leaderboard_ranking_and_visibility_rules(domain):
    admin, teacher, student, cohort, _, submission = domain
    submission.score = 91
    submission.is_locked = True
    submission.save(update_fields=["score", "is_locked"])

    visible_response = auth_client(student).get(f"/api/leaderboard/?cohort_id={cohort.id}")
    cohort.leaderboard_visible = False
    cohort.save(update_fields=["leaderboard_visible"])
    hidden_student_response = auth_client(student).get(f"/api/leaderboard/?cohort_id={cohort.id}")
    hidden_teacher_response = auth_client(teacher).get(f"/api/leaderboard/?cohort_id={cohort.id}")
    admin_response = auth_client(admin).get(f"/api/leaderboard/?cohort_id={cohort.id}")

    assert visible_response.status_code == 200
    assert visible_response.data["results"][0]["rank"] == 1
    assert hidden_student_response.status_code == 403
    assert hidden_teacher_response.status_code == 403
    assert admin_response.status_code == 200


def test_dashboard_summary_returns_role_specific_data(domain):
    admin, teacher, student, _, _, _ = domain

    student_response = auth_client(student).get("/api/dashboard/summary/")
    teacher_response = auth_client(teacher).get("/api/dashboard/summary/")
    admin_response = auth_client(admin).get("/api/dashboard/summary/")

    assert student_response.status_code == 200
    assert student_response.data["role"] == "student"
    assert "progress" in student_response.data
    assert teacher_response.data["role"] == "teacher"
    assert "pending_grading" in teacher_response.data
    assert admin_response.data["role"] == "admin"
    assert "applications" in admin_response.data
