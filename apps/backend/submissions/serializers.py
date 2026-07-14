from rest_framework import serializers

from accounts.choices import UserRole
from learning.models import Assignment
from submissions.models import Submission


class SubmissionSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    assignment_id = serializers.CharField(write_only=True)
    assignment_title = serializers.CharField(source="assignment.title", read_only=True)
    student_id = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source="student.email", read_only=True)
    content = serializers.CharField(source="primary_link")
    status = serializers.SerializerMethodField()
    grade = serializers.SerializerMethodField()
    graded_by_id = serializers.SerializerMethodField()
    graded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            "id",
            "assignment_id",
            "assignment_title",
            "student_id",
            "student_name",
            "student_email",
            "content",
            "submitted_at",
            "status",
            "grade",
            "feedback",
            "graded_by_id",
            "graded_by_name",
            "graded_at",
            "is_late",
        ]
        read_only_fields = [
            "id",
            "assignment_title",
            "student_id",
            "student_name",
            "student_email",
            "submitted_at",
            "status",
            "grade",
            "feedback",
            "graded_by_id",
            "graded_by_name",
            "graded_at",
            "is_late",
        ]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_student_id(self, obj) -> str:
        return str(obj.student_id)

    def get_student_name(self, obj) -> str:
        name = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return name or obj.student.email

    def get_status(self, obj) -> str:
        return "graded" if obj.score is not None else "pending"

    def get_grade(self, obj) -> float | None:
        return float(obj.score) if obj.score is not None else None

    def get_graded_by_id(self, obj) -> str | None:
        return str(obj.graded_by_id) if obj.graded_by_id else None

    def get_graded_by_name(self, obj) -> str | None:
        if not obj.graded_by:
            return None
        name = f"{obj.graded_by.first_name} {obj.graded_by.last_name}".strip()
        return name or obj.graded_by.email

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["assignment_id"] = str(instance.assignment_id)
        return data

    def validate_assignment_id(self, value):
        try:
            assignment = Assignment.objects.select_related("cohort").get(id=value)
        except Assignment.DoesNotExist as exc:
            raise serializers.ValidationError("Assignment does not exist.") from exc
        request = self.context["request"]
        if request.user.role != UserRole.STUDENT:
            raise serializers.ValidationError("Only students can submit assignments.")
        if request.user.cohort_id != assignment.cohort_id:
            raise serializers.ValidationError("Students can only submit to their own cohort assignments.")
        if assignment.is_locked:
            raise serializers.ValidationError("This assignment is locked and no longer accepts submissions.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        assignment = Assignment.objects.get(id=validated_data.pop("assignment_id"))
        if assignment.is_locked:
            raise serializers.ValidationError({"detail": "This assignment is locked and no longer accepts submissions."})
        existing = Submission.objects.filter(assignment=assignment, student=request.user).first()
        if existing and existing.is_locked:
            raise serializers.ValidationError({"detail": "This submission has been graded and is locked for student edits."})
        submission, _ = Submission.objects.update_or_create(
            assignment=assignment,
            student=request.user,
            defaults={
                "primary_link": validated_data["primary_link"],
                "is_late": timezone_now() > assignment.due_date,
            },
        )
        return submission


def timezone_now():
    from django.utils import timezone

    return timezone.now()


class GradeSubmissionSerializer(serializers.Serializer):
    grade = serializers.DecimalField(max_digits=5, decimal_places=2)
    feedback = serializers.CharField(min_length=5)
