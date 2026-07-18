from datetime import timedelta
from io import BytesIO

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from accounts.choices import UserRole, UserStatus
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole
from core.upload_validation import validate_image_upload
from learning.models import Lesson, LessonImage, Module, ModuleStatus, Resource
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


def png_file(name="lesson.png"):
    buffer = BytesIO()
    Image.new("RGB", (2, 2), color="white").save(buffer, format="PNG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/png")


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


def test_teacher_can_create_multiple_modules_in_same_week():
    teacher, _, cohort = domain()
    teacher_client = auth_client(teacher)

    first_response = teacher_client.post(
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
    second_response = teacher_client.post(
        "/api/modules/",
        {
            "cohort_id": str(cohort.id),
            "module_number": 1,
            "title": "Applied Workshop",
            "description": "Practice the basics.",
            "status": "draft",
        },
        format="json",
    )
    list_response = teacher_client.get(f"/api/modules/?cohort_id={cohort.id}")

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    same_week_modules = [item for item in list_response.data if item["module_number"] == 1]
    assert [item["title"] for item in same_week_modules] == ["Applied Workshop", "Foundations"]


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


def test_teacher_can_upload_lesson_image_and_serializers_return_current_url():
    teacher, student, cohort = domain()
    module = Module.objects.create(cohort=cohort, module_number=1, title="Media", status=ModuleStatus.PUBLISHED, created_by=teacher)
    lesson = Lesson.objects.create(module=module, title="Image Lesson", order=1)
    teacher_client = auth_client(teacher)

    upload_response = teacher_client.post(
        "/api/lesson-images/",
        {"lesson_id": str(lesson.id), "image": png_file(), "alt_text": "Architecture diagram"},
        format="multipart",
    )
    student_modules_response = auth_client(student).get("/api/modules/")

    assert upload_response.status_code == 201
    assert upload_response.data["lesson_id"] == str(lesson.id)
    assert upload_response.data["image_url"]
    assert upload_response.data["alt_text"] == "Architecture diagram"
    assert student_modules_response.data[0]["lessons"][0]["images"][0]["image_url"]
    assert student_modules_response.data[0]["lessons"][0]["images"][0]["id"] == upload_response.data["id"]


def test_lesson_image_upload_permissions_and_validation_are_enforced():
    teacher, student, cohort = domain()
    other_teacher = create_user("other-teacher-weeks@example.com", UserRole.TEACHER)
    module = Module.objects.create(cohort=cohort, module_number=1, title="Protected Media", status=ModuleStatus.PUBLISHED, created_by=teacher)
    lesson = Lesson.objects.create(module=module, title="Protected Image", order=1)
    lesson_image = LessonImage.objects.create(lesson=lesson, image=png_file("stored.png"), alt_text="Stored", uploaded_by=teacher)

    student_upload_response = auth_client(student).post(
        "/api/lesson-images/",
        {"lesson_id": str(lesson.id), "image": png_file("student.png")},
        format="multipart",
    )
    other_teacher_upload_response = auth_client(other_teacher).post(
        "/api/lesson-images/",
        {"lesson_id": str(lesson.id), "image": png_file("other.png")},
        format="multipart",
    )
    invalid_extension_response = auth_client(teacher).post(
        "/api/lesson-images/",
        {
            "lesson_id": str(lesson.id),
            "image": SimpleUploadedFile("lesson.txt", b"not an image", content_type="text/plain"),
        },
        format="multipart",
    )
    student_delete_response = auth_client(student).delete(f"/api/lesson-images/{lesson_image.id}/")
    teacher_delete_response = auth_client(teacher).delete(f"/api/lesson-images/{lesson_image.id}/")

    assert student_upload_response.status_code == 403
    assert other_teacher_upload_response.status_code == 400
    assert invalid_extension_response.status_code == 400
    assert student_delete_response.status_code == 403
    assert teacher_delete_response.status_code == 204


def test_students_only_receive_lesson_images_for_published_own_cohort_lessons():
    teacher, student, cohort = domain()
    other_program = Program.objects.create(title="Other Media", slug="other-media", description="", status=ProgramStatus.ACTIVE)
    other_cohort = Cohort.objects.create(
        program=other_program,
        name="Other Media Cohort",
        start_date=timezone.localdate(),
        end_date=timezone.localdate() + timedelta(weeks=12),
        status=CohortStatus.ACTIVE,
    )
    own_module = Module.objects.create(cohort=cohort, module_number=1, title="Published", status=ModuleStatus.PUBLISHED, created_by=teacher)
    draft_module = Module.objects.create(cohort=cohort, module_number=2, title="Draft", status=ModuleStatus.DRAFT, created_by=teacher)
    other_module = Module.objects.create(cohort=other_cohort, module_number=1, title="Other", status=ModuleStatus.PUBLISHED, created_by=teacher)
    own_lesson = Lesson.objects.create(module=own_module, title="Own", order=1)
    draft_lesson = Lesson.objects.create(module=draft_module, title="Draft", order=1)
    other_lesson = Lesson.objects.create(module=other_module, title="Other", order=1)
    own_image = LessonImage.objects.create(lesson=own_lesson, image=png_file("own.png"), uploaded_by=teacher)
    LessonImage.objects.create(lesson=draft_lesson, image=png_file("draft.png"), uploaded_by=teacher)
    LessonImage.objects.create(lesson=other_lesson, image=png_file("other.png"), uploaded_by=teacher)

    response = auth_client(student).get("/api/lesson-images/")

    assert response.status_code == 200
    assert [item["id"] for item in response.data] == [str(own_image.id)]


def test_lesson_image_size_validation_rejects_large_images():
    oversized = SimpleUploadedFile("large.png", b"x" * (5 * 1024 * 1024 + 1), content_type="image/png")

    with pytest.raises(Exception):
        validate_image_upload(oversized)
