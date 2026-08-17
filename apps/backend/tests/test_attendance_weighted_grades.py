from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from attendance.models import AttendanceRecord, AttendanceSession, AttendanceStatus
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole
from learning.models import Assignment, Lesson, Module, ModuleStatus
from programs.models import Program, ProgramStatus
from submissions.models import Submission


pytestmark = pytest.mark.django_db


def create_user(email, role, *, cohort=None, status=UserStatus.ACTIVE):
    User = get_user_model()
    return User.objects.create_user(
        username=email,
        email=email,
        password="password",
        first_name=email.split("@")[0].title(),
        last_name="User",
        name=f"{email.split('@')[0].title()} User",
        role=role,
        status=status,
        cohort=cohort,
    )


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def domain():
    admin = create_user("attendance-admin@example.com", UserRole.ADMIN)
    teacher = create_user("attendance-teacher@example.com", UserRole.TEACHER)
    other_teacher = create_user("attendance-other@example.com", UserRole.TEACHER)
    program = Program.objects.create(title="Attendance", slug="attendance", description="", status=ProgramStatus.ACTIVE)
    cohort = Cohort.objects.create(
        program=program,
        name="Attendance Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=12),
        status=CohortStatus.ACTIVE,
    )
    TeacherAssignment.objects.create(teacher=teacher, cohort=cohort, role=TeacherAssignmentRole.LEAD)
    student = create_user("attendance-student@example.com", UserRole.STUDENT, cohort=cohort)
    module = Module.objects.create(cohort=cohort, module_number=1, title="Module", status=ModuleStatus.PUBLISHED, created_by=teacher)
    lesson = Lesson.objects.create(module=module, title="Lesson", order=1)
    assignment = Assignment.objects.create(
        cohort=cohort,
        module=module,
        lesson=lesson,
        title="Assignment",
        description="Submit work.",
        max_points=100,
        due_date=timezone.now() + timedelta(days=1),
        created_by=teacher,
    )
    submission = Submission.objects.create(assignment=assignment, student=student, primary_link="https://example.com")
    return {
        "admin": admin,
        "teacher": teacher,
        "other_teacher": other_teacher,
        "cohort": cohort,
        "student": student,
        "assignment": assignment,
        "submission": submission,
    }


def test_teacher_can_create_attendance_for_assigned_cohort_only(domain):
    response = auth_client(domain["teacher"]).post(
        "/api/attendance-sessions/",
        {"cohort_id": str(domain["cohort"].id), "date": str(timezone.localdate()), "title": "Day 1"},
        format="json",
    )
    duplicate = auth_client(domain["teacher"]).post(
        "/api/attendance-sessions/",
        {"cohort_id": str(domain["cohort"].id), "date": str(timezone.localdate()), "title": "Duplicate"},
        format="json",
    )
    blocked = auth_client(domain["other_teacher"]).post(
        "/api/attendance-sessions/",
        {"cohort_id": str(domain["cohort"].id), "date": str(timezone.localdate() + timedelta(days=1))},
        format="json",
    )
    student_blocked = auth_client(domain["student"]).post(
        "/api/attendance-sessions/",
        {"cohort_id": str(domain["cohort"].id), "date": str(timezone.localdate() + timedelta(days=2))},
        format="json",
    )

    assert response.status_code == 201
    assert duplicate.status_code == 400
    assert blocked.status_code == 400
    assert student_blocked.status_code == 403


def test_bulk_attendance_records_upsert_and_score_statuses(domain):
    session = AttendanceSession.objects.create(cohort=domain["cohort"], date=timezone.localdate(), recorded_by=domain["teacher"])
    client = auth_client(domain["teacher"])

    first = client.post(
        f"/api/attendance-sessions/{session.id}/records/",
        {"records": [{"student_id": str(domain["student"].id), "status": "late", "note": "Traffic"}]},
        format="json",
    )
    second = client.post(
        f"/api/attendance-sessions/{session.id}/records/",
        {"records": [{"student_id": str(domain["student"].id), "status": "excused", "note": "Approved"}]},
        format="json",
    )

    record = AttendanceRecord.objects.get(session=session, student=domain["student"])
    assert first.status_code == 200
    assert second.status_code == 200
    assert AttendanceRecord.objects.count() == 1
    assert record.status == AttendanceStatus.EXCUSED
    assert record.credit == 1


def test_attendance_records_reject_inactive_students(domain):
    inactive_student = create_user("inactive-attendance@example.com", UserRole.STUDENT, cohort=domain["cohort"], status=UserStatus.SUSPENDED)
    session = AttendanceSession.objects.create(cohort=domain["cohort"], date=timezone.localdate(), recorded_by=domain["teacher"])

    response = auth_client(domain["teacher"]).post(
        f"/api/attendance-sessions/{session.id}/records/",
        {"records": [{"student_id": str(inactive_student.id), "status": "present"}]},
        format="json",
    )

    assert response.status_code == 400
    assert AttendanceRecord.objects.count() == 0


def test_grade_settings_permissions_and_weight_validation(domain):
    valid = auth_client(domain["teacher"]).patch(
        f"/api/cohorts/{domain['cohort'].id}/grade-settings/",
        {"assignment_weight": 80, "attendance_weight": 20},
        format="json",
    )
    invalid = auth_client(domain["teacher"]).patch(
        f"/api/cohorts/{domain['cohort'].id}/grade-settings/",
        {"assignment_weight": 80, "attendance_weight": 30},
        format="json",
    )
    blocked = auth_client(domain["other_teacher"]).patch(
        f"/api/cohorts/{domain['cohort'].id}/grade-settings/",
        {"assignment_weight": 70, "attendance_weight": 30},
        format="json",
    )

    domain["cohort"].refresh_from_db()
    assert valid.status_code == 200
    assert float(domain["cohort"].assignment_weight) == 80
    assert invalid.status_code == 400
    assert blocked.status_code == 404


def test_weighted_student_dashboard_total_includes_attendance(domain):
    cohort = domain["cohort"]
    cohort.assignment_weight = 80
    cohort.attendance_weight = 20
    cohort.save(update_fields=["assignment_weight", "attendance_weight"])
    domain["submission"].score = 90
    domain["submission"].is_locked = True
    domain["submission"].save(update_fields=["score", "is_locked"])
    present = AttendanceSession.objects.create(cohort=cohort, date=timezone.localdate(), recorded_by=domain["teacher"])
    late = AttendanceSession.objects.create(cohort=cohort, date=timezone.localdate() + timedelta(days=1), recorded_by=domain["teacher"])
    AttendanceRecord.objects.create(session=present, student=domain["student"], status=AttendanceStatus.PRESENT, recorded_by=domain["teacher"])
    AttendanceRecord.objects.create(session=late, student=domain["student"], status=AttendanceStatus.LATE, recorded_by=domain["teacher"])

    response = auth_client(domain["student"]).get("/api/dashboard/summary/")

    assert response.status_code == 200
    assert response.data["grades"]["assignment_percent"] == 90
    assert response.data["grades"]["attendance_percent"] == 75
    assert response.data["grades"]["total_percent"] == 87


def test_graded_submission_can_be_updated_and_remains_locked(domain):
    client = auth_client(domain["teacher"])
    first = client.post(
        f"/api/submissions/{domain['submission'].id}/grade/",
        {"grade": 80, "feedback": "Initial feedback."},
        format="json",
    )
    second = client.post(
        f"/api/submissions/{domain['submission'].id}/grade/",
        {"grade": 95, "feedback": "Updated feedback."},
        format="json",
    )
    resubmit = auth_client(domain["student"]).post(
        "/api/submissions/",
        {"assignment_id": str(domain["assignment"].id), "content": "https://example.com/new"},
        format="json",
    )

    domain["submission"].refresh_from_db()
    assert first.status_code == 200
    assert second.status_code == 200
    assert float(domain["submission"].score) == 95
    assert domain["submission"].feedback == "Updated feedback."
    assert domain["submission"].is_locked is True
    assert resubmit.status_code == 400
    assert len(mail.outbox) == 2


def test_teacher_can_manually_grade_missing_submission(domain):
    missing_student = create_user("missing-grade@example.com", UserRole.STUDENT, cohort=domain["cohort"])

    response = auth_client(domain["teacher"]).post(
        f"/api/assignments/{domain['assignment'].id}/manual-grade/",
        {"student_id": str(missing_student.id), "grade": 88, "feedback": "Manual grade for missing work."},
        format="json",
    )

    submission = Submission.objects.get(assignment=domain["assignment"], student=missing_student)
    assert response.status_code == 200
    assert response.data["content"] == "No submission - manually graded"
    assert response.data["status"] == "graded"
    assert float(submission.score) == 88
    assert submission.is_locked is True
    assert len(mail.outbox) == 1


def test_unassigned_teacher_cannot_manually_grade_missing_submission(domain):
    missing_student = create_user("blocked-missing-grade@example.com", UserRole.STUDENT, cohort=domain["cohort"])

    response = auth_client(domain["other_teacher"]).post(
        f"/api/assignments/{domain['assignment'].id}/manual-grade/",
        {"student_id": str(missing_student.id), "grade": 88, "feedback": "Manual grade for missing work."},
        format="json",
    )

    assert response.status_code == 404
    assert not Submission.objects.filter(assignment=domain["assignment"], student=missing_student).exists()


def test_manual_grade_validates_assignment_max_points(domain):
    missing_student = create_user("invalid-missing-grade@example.com", UserRole.STUDENT, cohort=domain["cohort"])

    response = auth_client(domain["teacher"]).post(
        f"/api/assignments/{domain['assignment'].id}/manual-grade/",
        {"student_id": str(missing_student.id), "grade": 101, "feedback": "Manual grade for missing work."},
        format="json",
    )

    assert response.status_code == 400
    assert "Grade must be between 0 and 100" in str(response.data)


def test_student_dashboard_averages_normalized_assignment_scores(domain):
    cohort = domain["cohort"]
    student = domain["student"]
    teacher = domain["teacher"]
    domain["assignment"].max_points = 2
    domain["assignment"].save(update_fields=["max_points"])
    domain["submission"].score = 1
    domain["submission"].is_locked = True
    domain["submission"].save(update_fields=["score", "is_locked"])
    ten_point_assignment = Assignment.objects.create(
        cohort=cohort,
        module=domain["assignment"].module,
        lesson=domain["assignment"].lesson,
        title="Ten Point Assignment",
        description="Submit work.",
        max_points=10,
        due_date=timezone.now() + timedelta(days=1),
        created_by=teacher,
    )
    hundred_point_assignment = Assignment.objects.create(
        cohort=cohort,
        module=domain["assignment"].module,
        lesson=domain["assignment"].lesson,
        title="Hundred Point Assignment",
        description="Submit work.",
        max_points=100,
        due_date=timezone.now() + timedelta(days=1),
        created_by=teacher,
    )
    zero_small_assignment = Assignment.objects.create(
        cohort=cohort,
        module=domain["assignment"].module,
        lesson=domain["assignment"].lesson,
        title="Zero Small Assignment",
        description="Submit work.",
        max_points=2,
        due_date=timezone.now() + timedelta(days=1),
        created_by=teacher,
    )
    Submission.objects.create(assignment=ten_point_assignment, student=student, primary_link="https://example.com/ten", score=8, is_locked=True)
    Submission.objects.create(assignment=hundred_point_assignment, student=student, primary_link="https://example.com/hundred", score=80, is_locked=True)
    Submission.objects.create(assignment=zero_small_assignment, student=student, primary_link="https://example.com/zero", score=0, is_locked=True)

    response = auth_client(student).get("/api/dashboard/summary/")

    assert response.status_code == 200
    assert response.data["grades"]["assignment_percent"] == 62.5
    assert response.data["grades"]["average"] == 62.5
