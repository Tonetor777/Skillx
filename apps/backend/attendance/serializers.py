from rest_framework import serializers

from accounts.choices import UserRole
from accounts.models import User
from attendance.models import AttendanceRecord, AttendanceSession, AttendanceStatus
from cohorts.models import Cohort


def can_access_cohort(user, cohort: Cohort) -> bool:
    if user.role in {UserRole.ADMIN, UserRole.SUPER_ADMIN}:
        return True
    if user.role == UserRole.TEACHER:
        return cohort.teacher_assignments.filter(teacher=user).exists()
    return user.role == UserRole.STUDENT and user.cohort_id == cohort.id


def can_manage_cohort(user, cohort: Cohort) -> bool:
    if user.role in {UserRole.ADMIN, UserRole.SUPER_ADMIN}:
        return True
    return user.role == UserRole.TEACHER and cohort.teacher_assignments.filter(teacher=user).exists()


class AttendanceRecordSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    student_id = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    student_email = serializers.CharField(source="student.email", read_only=True)
    status = serializers.SerializerMethodField()
    credit = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = ["id", "student_id", "student_name", "student_email", "status", "note", "credit", "updated_at"]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_student_id(self, obj) -> str:
        return str(obj.student_id)

    def get_student_name(self, obj) -> str:
        name = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return name or obj.student.email

    def get_status(self, obj) -> str:
        return obj.status.lower()

    def get_credit(self, obj) -> float:
        return obj.credit


class AttendanceSessionSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    cohort_id = serializers.CharField(write_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    recorded_by_name = serializers.SerializerMethodField()
    records = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceSession
        fields = [
            "id",
            "cohort_id",
            "cohort_name",
            "date",
            "title",
            "recorded_by_name",
            "records",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "cohort_name", "recorded_by_name", "records", "created_at", "updated_at"]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_recorded_by_name(self, obj) -> str:
        if not obj.recorded_by:
            return ""
        name = f"{obj.recorded_by.first_name} {obj.recorded_by.last_name}".strip()
        return name or obj.recorded_by.email

    def get_records(self, obj) -> list[dict]:
        records = obj.records.all()
        request = self.context.get("request")
        if request and request.user.role == UserRole.STUDENT:
            records = records.filter(student=request.user)
        return AttendanceRecordSerializer(records, many=True, context=self.context).data

    def validate_cohort_id(self, value):
        try:
            cohort = Cohort.objects.get(id=value)
        except Cohort.DoesNotExist as exc:
            raise serializers.ValidationError("Cohort does not exist.") from exc
        if not can_manage_cohort(self.context["request"].user, cohort):
            raise serializers.ValidationError("You can only manage attendance for assigned cohorts.")
        return value

    def validate(self, attrs):
        cohort_id = attrs.get("cohort_id") or getattr(self.instance, "cohort_id", None)
        date = attrs.get("date") or getattr(self.instance, "date", None)
        if cohort_id and date:
            duplicate = AttendanceSession.objects.filter(cohort_id=cohort_id, date=date)
            if self.instance:
                duplicate = duplicate.exclude(id=self.instance.id)
            if duplicate.exists():
                raise serializers.ValidationError({"date": "Attendance already exists for this cohort date."})
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        return AttendanceSession.objects.create(
            cohort_id=validated_data.pop("cohort_id"),
            recorded_by=request.user,
            **validated_data,
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["cohort_id"] = str(instance.cohort_id)
        return data


class AttendanceRecordUpsertSerializer(serializers.Serializer):
    student_id = serializers.CharField()
    status = serializers.ChoiceField(choices=[choice.lower() for choice in AttendanceStatus.values])
    note = serializers.CharField(required=False, allow_blank=True)

    def validate_student_id(self, value):
        session = self.context["session"]
        try:
            student = User.objects.get(id=value, cohort_id=session.cohort_id, role=UserRole.STUDENT)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("Student must belong to this attendance session cohort.") from exc
        return value


class AttendanceBulkRecordsSerializer(serializers.Serializer):
    records = AttendanceRecordUpsertSerializer(many=True)
