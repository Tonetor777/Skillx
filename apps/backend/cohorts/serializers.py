from rest_framework import serializers

from accounts.choices import UserRole
from accounts.models import User
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole


class CohortTeacherSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "avatar_url", "created_at"]

    def get_id(self, obj):
        return str(obj.id)

    def get_role(self, obj):
        return obj.role.lower()

    def get_avatar_url(self, obj):
        if not obj.photo:
            return ""
        request = self.context.get("request")
        url = obj.photo.url
        return request.build_absolute_uri(url) if request else url


class TeacherAssignmentSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    teacher_id = serializers.CharField(write_only=True)
    cohort_id = serializers.CharField(write_only=True)
    teacher = CohortTeacherSerializer(read_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    role = serializers.CharField()

    class Meta:
        model = TeacherAssignment
        fields = ["id", "teacher_id", "teacher", "cohort_id", "cohort_name", "role", "assigned_at"]

    def get_id(self, obj):
        return str(obj.id)

    def validate_teacher_id(self, value):
        try:
            teacher = User.objects.get(id=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Teacher does not exist.") from exc
        if teacher.role != UserRole.TEACHER:
            raise serializers.ValidationError("Only users with the teacher role can be assigned to cohorts.")
        return value

    def validate_role(self, value):
        normalized = value.upper()
        if normalized not in TeacherAssignmentRole.values:
            raise serializers.ValidationError("Teacher assignment role is invalid.")
        return normalized

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["teacher_id"] = str(instance.teacher_id)
        data["cohort_id"] = str(instance.cohort_id)
        data["role"] = instance.role.lower()
        return data


class CohortSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    program_id = serializers.CharField(write_only=True)
    program_name = serializers.CharField(source="program.title", read_only=True)
    is_active = serializers.BooleanField(write_only=True, required=False)
    students_count = serializers.IntegerField(source="students.count", read_only=True)
    teachers = serializers.SerializerMethodField()
    status = serializers.CharField(required=False)

    class Meta:
        model = Cohort
        fields = [
            "id",
            "name",
            "program_id",
            "program_name",
            "start_date",
            "end_date",
            "is_active",
            "students_count",
            "teachers",
            "status",
            "current_week",
            "duration_weeks",
            "leaderboard_visible",
        ]

    def get_id(self, obj):
        return str(obj.id)

    def get_teachers(self, obj):
        teachers = User.objects.filter(teaching_assignments__cohort=obj).distinct()
        return CohortTeacherSerializer(teachers, many=True, context=self.context).data

    def _frontend_status(self, obj):
        if obj.status == CohortStatus.ACTIVE:
            return "active"
        if obj.status == CohortStatus.COMPLETED:
            return "completed"
        if obj.status == CohortStatus.ARCHIVED:
            return "archived"
        return "upcoming"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["program_id"] = str(instance.program_id)
        data["is_active"] = instance.status == CohortStatus.ACTIVE
        data["status"] = self._frontend_status(instance)
        return data

    def validate_status(self, value):
        normalized = value.upper()
        aliases = {"UPCOMING": CohortStatus.DRAFT}
        normalized = aliases.get(normalized, normalized)
        if normalized not in CohortStatus.values:
            raise serializers.ValidationError("Cohort status is invalid.")
        return normalized

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})
        duration_weeks = attrs.get("duration_weeks", getattr(self.instance, "duration_weeks", 1))
        current_week = attrs.get("current_week", getattr(self.instance, "current_week", 1))
        if current_week < 1 or current_week > duration_weeks:
            raise serializers.ValidationError({"current_week": "Current week must be within the cohort duration."})
        return attrs

    def create(self, validated_data):
        active = validated_data.pop("is_active", True)
        validated_data["status"] = CohortStatus.ACTIVE if active else CohortStatus.DRAFT
        validated_data["duration_weeks"] = max((validated_data["end_date"] - validated_data["start_date"]).days // 7, 1)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        active = validated_data.pop("is_active", None)
        if active is not None:
            validated_data["status"] = CohortStatus.ACTIVE if active else CohortStatus.DRAFT
        if "end_date" in validated_data or "start_date" in validated_data:
            start_date = validated_data.get("start_date", instance.start_date)
            end_date = validated_data.get("end_date", instance.end_date)
            validated_data["duration_weeks"] = max((end_date - start_date).days // 7, 1)
        return super().update(instance, validated_data)
