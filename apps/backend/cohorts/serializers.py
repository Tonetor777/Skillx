from rest_framework import serializers

from accounts.choices import UserRole
from accounts.models import User
from cohorts.models import Cohort, CohortStatus, TeacherAssignment, TeacherAssignmentRole
from programs.models import Program


class CohortTeacherSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "avatar_url", "created_at"]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_role(self, obj) -> str:
        return obj.role.lower()

    def get_avatar_url(self, obj) -> str:
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

    def get_id(self, obj) -> str:
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
    students = serializers.SerializerMethodField()
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
            "students",
            "teachers",
            "status",
            "current_week",
            "duration_weeks",
            "leaderboard_visible",
            "assignment_weight",
            "attendance_weight",
        ]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_teachers(self, obj) -> list[dict]:
        teachers = User.objects.filter(teaching_assignments__cohort=obj).distinct()
        return CohortTeacherSerializer(teachers, many=True, context=self.context).data

    def get_students(self, obj) -> list[dict]:
        students = obj.students.order_by("first_name", "last_name", "email")
        request = self.context.get("request")
        if request and request.user.role == UserRole.STUDENT:
            students = students.filter(id=request.user.id)
        return [
            {
                "id": str(student.id),
                "email": student.email,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "name": f"{student.first_name} {student.last_name}".strip() or student.email,
            }
            for student in students
        ]

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

    def validate_program_id(self, value):
        try:
            Program.objects.get(id=value)
        except (Program.DoesNotExist, ValueError) as exc:
            raise serializers.ValidationError("Program does not exist.") from exc
        return value

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


class CohortGradeSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cohort
        fields = ["assignment_weight", "attendance_weight"]

    def validate(self, attrs):
        assignment_weight = attrs.get("assignment_weight", getattr(self.instance, "assignment_weight", 90))
        attendance_weight = attrs.get("attendance_weight", getattr(self.instance, "attendance_weight", 10))
        if assignment_weight < 0 or attendance_weight < 0:
            raise serializers.ValidationError("Grade weights cannot be negative.")
        if assignment_weight + attendance_weight != 100:
            raise serializers.ValidationError("Assignment and attendance weights must total 100.")
        return attrs
