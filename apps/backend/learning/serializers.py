from datetime import date, datetime, time

from django.utils import timezone
from rest_framework import serializers

from accounts.choices import UserRole
from cohorts.models import Cohort
from learning.models import Assignment, Lesson, Module, ModuleStatus, Resource


def validate_teacher_scope(user, cohort):
    if user.role == UserRole.TEACHER and not cohort.teacher_assignments.filter(teacher=user).exists():
        raise serializers.ValidationError("Teachers can only manage content for assigned cohorts.")


class ResourceSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    lesson_id = serializers.PrimaryKeyRelatedField(source="lesson", queryset=Lesson.objects.all(), write_only=True)

    class Meta:
        model = Resource
        fields = ["id", "lesson_id", "title", "url", "order"]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def validate_lesson_id(self, lesson):
        validate_teacher_scope(self.context["request"].user, lesson.module.cohort)
        return lesson

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["lesson_id"] = str(instance.lesson_id)
        return data


class LessonSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    module_id = serializers.PrimaryKeyRelatedField(source="module", queryset=Module.objects.all(), write_only=True)
    module_title = serializers.CharField(source="module.title", read_only=True)
    cohort_id = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source="module.cohort.name", read_only=True)
    resources = ResourceSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "module_id",
            "module_title",
            "cohort_id",
            "cohort_name",
            "title",
            "objectives",
            "content",
            "recording",
            "order",
            "resources",
        ]
        read_only_fields = ["id", "module_title", "cohort_id", "cohort_name", "resources"]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_cohort_id(self, obj) -> str:
        return str(obj.module.cohort_id)

    def validate_module_id(self, module):
        validate_teacher_scope(self.context["request"].user, module.cohort)
        return module

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["module_id"] = str(instance.module_id)
        return data


class ModuleSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    cohort_id = serializers.CharField(write_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    lessons = LessonSerializer(many=True, read_only=True)
    status = serializers.CharField(required=False)
    published_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            "id",
            "cohort_id",
            "cohort_name",
            "module_number",
            "title",
            "description",
            "notes",
            "status",
            "publish_date",
            "published_by_name",
            "lessons",
        ]
        read_only_fields = ["id", "cohort_name", "publish_date", "published_by_name", "lessons"]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_published_by_name(self, obj) -> str | None:
        if not obj.published_by:
            return None
        name = f"{obj.published_by.first_name} {obj.published_by.last_name}".strip()
        return name or obj.published_by.email

    def validate_status(self, value):
        normalized = value.upper()
        if normalized not in ModuleStatus.values:
            raise serializers.ValidationError("Module status is invalid.")
        return normalized

    def validate_cohort_id(self, value):
        try:
            cohort = Cohort.objects.get(id=value)
        except Cohort.DoesNotExist as exc:
            raise serializers.ValidationError("Cohort does not exist.") from exc
        validate_teacher_scope(self.context["request"].user, cohort)
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["cohort_id"] = str(instance.cohort_id)
        data["status"] = instance.status.lower()
        return data

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class FlexibleDueDateField(serializers.DateTimeField):
    def to_internal_value(self, value):
        if isinstance(value, str) and len(value) == 10:
            parsed_date = date.fromisoformat(value)
            return timezone.make_aware(datetime.combine(parsed_date, time.max))
        return super().to_internal_value(value)


class AssignmentSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    lesson_id = serializers.PrimaryKeyRelatedField(source="lesson", queryset=Lesson.objects.select_related("module", "module__cohort"), write_only=True)
    resource_id = serializers.PrimaryKeyRelatedField(source="resource", queryset=Resource.objects.select_related("lesson"), required=False, allow_null=True, write_only=True)
    cohort_id = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    module_id = serializers.SerializerMethodField()
    module_title = serializers.CharField(source="module.title", read_only=True)
    lesson_title = serializers.CharField(source="lesson.title", read_only=True)
    resource_title = serializers.CharField(source="resource.title", read_only=True)
    due_date = FlexibleDueDateField()

    class Meta:
        model = Assignment
        fields = [
            "id",
            "title",
            "description",
            "max_points",
            "due_date",
            "cohort_id",
            "cohort_name",
            "module_id",
            "module_title",
            "lesson_id",
            "lesson_title",
            "resource_id",
            "resource_title",
            "is_locked",
        ]
        read_only_fields = [
            "id",
            "cohort_id",
            "cohort_name",
            "module_id",
            "module_title",
            "lesson_title",
            "resource_title",
            "is_locked",
        ]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_cohort_id(self, obj) -> str:
        return str(obj.cohort_id)

    def get_module_id(self, obj) -> str | None:
        return str(obj.module_id) if obj.module_id else None

    def validate_lesson_id(self, lesson):
        validate_teacher_scope(self.context["request"].user, lesson.module.cohort)
        return lesson

    def validate_resource_id(self, resource):
        if resource:
            validate_teacher_scope(self.context["request"].user, resource.lesson.module.cohort)
        return resource

    def validate(self, attrs):
        lesson = attrs.get("lesson") or getattr(self.instance, "lesson", None)
        resource = attrs.get("resource") or getattr(self.instance, "resource", None)
        if resource and lesson and resource.lesson_id != lesson.id:
            raise serializers.ValidationError({"resource_id": "Resource must belong to the selected lesson."})
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["lesson_id"] = str(instance.lesson_id) if instance.lesson_id else None
        data["resource_id"] = str(instance.resource_id) if instance.resource_id else None
        return data

    def create(self, validated_data):
        request = self.context["request"]
        lesson = validated_data["lesson"]
        validated_data["module"] = lesson.module
        validated_data["cohort"] = lesson.module.cohort
        validated_data["created_by"] = request.user
        return super().create(validated_data)
