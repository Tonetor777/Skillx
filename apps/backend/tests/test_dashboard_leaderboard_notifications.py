from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from announcements.models import Announcement, AnnouncementRead
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole
from learning.models import Assignment, Lesson, Module, ModuleStatus
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
    module = Module.objects.create(cohort=cohort, module_number=1, title="Final Module", status=ModuleStatus.PUBLISHED, created_by=teacher)
    lesson = Lesson.objects.create(module=module, title="Final Lesson", order=1)
    assignment = Assignment.objects.create(
        cohort=cohort,
        module=module,
        lesson=lesson,
        title="Final Assignment",
        description="Submit work.",
        max_points=100,
        due_date=timezone.now() + timedelta(days=1),
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
    message = mail.outbox[0]
    assert "grade was posted" in message.subject
    assert "Nexus Academy" in message.subject
    assert "Score: 95/100" in message.body
    assert message.alternatives
    assert "Grade posted" in message.alternatives[0][0]
    assert message.alternatives[0][1] == "text/html"


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


def test_announcement_unread_count_respects_student_scope_and_schedule(domain):
    admin, _, student, cohort, _, _ = domain
    other_program = Program.objects.create(title="Other", slug="other-notices", description="", status=ProgramStatus.ACTIVE)
    other_cohort = Cohort.objects.create(
        program=other_program,
        name="Other Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=4),
        status=CohortStatus.ACTIVE,
    )
    system = Announcement.objects.create(title="System", message="All users.", created_by=admin)
    cohort_notice = Announcement.objects.create(title="Cohort", message="Class only.", cohort=cohort, created_by=admin)
    program_notice = Announcement.objects.create(title="Program", message="Program only.", program=cohort.program, created_by=admin)
    Announcement.objects.create(title="Other", message="Hidden.", cohort=other_cohort, created_by=admin)
    Announcement.objects.create(
        title="Future",
        message="Later.",
        cohort=cohort,
        created_by=admin,
        scheduled_for=timezone.now() + timedelta(days=1),
    )
    AnnouncementRead.objects.create(announcement=system, user=student)

    response = auth_client(student).get("/api/announcements/unread-count/")
    list_response = auth_client(student).get("/api/announcements/")

    assert response.status_code == 200
    assert response.data["count"] == 2
    assert {item["title"] for item in list_response.data} == {"System", "Cohort", "Program"}
    assert {item["title"]: item["is_read"] for item in list_response.data} == {
        "System": True,
        "Cohort": False,
        "Program": False,
    }
    assert cohort_notice.id != program_notice.id


def test_announcement_unread_count_respects_teacher_scope(domain):
    admin, teacher, _, cohort, _, _ = domain
    other_program = Program.objects.create(title="Hidden Teacher", slug="hidden-teacher", description="", status=ProgramStatus.ACTIVE)
    other_cohort = Cohort.objects.create(
        program=other_program,
        name="Hidden Teacher Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=4),
        status=CohortStatus.ACTIVE,
    )
    Announcement.objects.create(title="System", message="All users.", created_by=admin)
    Announcement.objects.create(title="Assigned Cohort", message="Teacher class.", cohort=cohort, created_by=admin)
    Announcement.objects.create(title="Assigned Program", message="Teacher program.", program=cohort.program, created_by=admin)
    Announcement.objects.create(title="Hidden Cohort", message="Other class.", cohort=other_cohort, created_by=admin)

    response = auth_client(teacher).get("/api/announcements/unread-count/")

    assert response.status_code == 200
    assert response.data["count"] == 3


def test_admin_unread_count_includes_due_announcements(domain):
    admin, _, _, cohort, _, _ = domain
    Announcement.objects.create(title="System", message="All users.", created_by=admin)
    Announcement.objects.create(title="Cohort", message="Class.", cohort=cohort, created_by=admin)
    Announcement.objects.create(
        title="Future",
        message="Later.",
        cohort=cohort,
        created_by=admin,
        scheduled_for=timezone.now() + timedelta(days=1),
    )

    response = auth_client(admin).get("/api/announcements/unread-count/")

    assert response.status_code == 200
    assert response.data["count"] == 2


def test_mark_announcement_read_is_idempotent(domain):
    admin, _, student, cohort, _, _ = domain
    announcement = Announcement.objects.create(title="Read me", message="Notice.", cohort=cohort, created_by=admin)
    client = auth_client(student)

    first = client.post(f"/api/announcements/{announcement.id}/mark-read/")
    second = client.post(f"/api/announcements/{announcement.id}/mark-read/")
    count = client.get("/api/announcements/unread-count/")

    assert first.status_code == 200
    assert second.status_code == 200
    assert AnnouncementRead.objects.filter(announcement=announcement, user=student).count() == 1
    assert count.data["count"] == 0


def test_mark_all_read_marks_only_visible_announcements(domain):
    admin, _, student, cohort, _, _ = domain
    other_program = Program.objects.create(title="Other Mark", slug="other-mark", description="", status=ProgramStatus.ACTIVE)
    other_cohort = Cohort.objects.create(
        program=other_program,
        name="Other Mark Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=4),
        status=CohortStatus.ACTIVE,
    )
    visible = Announcement.objects.create(title="Visible", message="Class.", cohort=cohort, created_by=admin)
    hidden = Announcement.objects.create(title="Hidden", message="Other.", cohort=other_cohort, created_by=admin)
    future = Announcement.objects.create(
        title="Future",
        message="Later.",
        cohort=cohort,
        created_by=admin,
        scheduled_for=timezone.now() + timedelta(days=1),
    )

    response = auth_client(student).post("/api/announcements/mark-all-read/")

    assert response.status_code == 200
    assert AnnouncementRead.objects.filter(user=student, announcement=visible).exists()
    assert not AnnouncementRead.objects.filter(user=student, announcement=hidden).exists()
    assert not AnnouncementRead.objects.filter(user=student, announcement=future).exists()


def test_cannot_mark_inaccessible_announcement_read(domain):
    admin, _, student, _, _, _ = domain
    other_program = Program.objects.create(title="Private", slug="private-notice", description="", status=ProgramStatus.ACTIVE)
    other_cohort = Cohort.objects.create(
        program=other_program,
        name="Private Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=4),
        status=CohortStatus.ACTIVE,
    )
    hidden = Announcement.objects.create(title="Hidden", message="Other.", cohort=other_cohort, created_by=admin)

    response = auth_client(student).post(f"/api/announcements/{hidden.id}/mark-read/")

    assert response.status_code == 404
    assert not AnnouncementRead.objects.filter(user=student, announcement=hidden).exists()


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
