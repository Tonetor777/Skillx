from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from accounts.choices import UserRole
from announcements.models import Announcement
from cohorts.models import Cohort
from programs.models import Program


class AnnouncementSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    content = serializers.CharField(source="message")
    target_type = serializers.ChoiceField(choices=["system", "program", "cohort"], write_only=True)
    target_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, write_only=True)
    target_name = serializers.SerializerMethodField()
    author_id = serializers.SerializerMethodField()
    author_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            "id",
            "title",
            "content",
            "target_type",
            "target_id",
            "target_name",
            "author_id",
            "author_name",
            "author_role",
            "is_read",
            "scheduled_for",
            "created_at",
        ]
        read_only_fields = ["id", "target_name", "author_id", "author_name", "author_role", "is_read", "created_at"]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_target_name(self, obj) -> str:
        if obj.program:
            return obj.program.title
        if obj.cohort:
            return obj.cohort.name
        return "Global Broadcast"

    def get_author_id(self, obj) -> str:
        return str(obj.created_by_id)

    def get_author_name(self, obj) -> str:
        name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return name or obj.created_by.email

    def get_author_role(self, obj) -> str:
        return obj.created_by.role.lower()

    def get_is_read(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.read_receipts.filter(user=request.user).exists()

    def validate(self, attrs):
        target_type = attrs.get("target_type")
        target_id = attrs.get("target_id")
        user = self.context["request"].user

        if target_type == "system":
            if target_id:
                raise serializers.ValidationError({"target_id": "System announcements cannot have a target id."})
            if user.role == UserRole.TEACHER:
                raise PermissionDenied("Teachers cannot create system announcements.")
            return attrs

        if not target_id:
            raise serializers.ValidationError({"target_id": "A target id is required."})

        if target_type == "cohort":
            try:
                cohort = Cohort.objects.get(id=target_id)
            except (Cohort.DoesNotExist, ValueError) as exc:
                raise serializers.ValidationError({"target_id": "Cohort does not exist."}) from exc
            if user.role == UserRole.TEACHER and not cohort.teacher_assignments.filter(teacher=user).exists():
                raise PermissionDenied("Teachers can only announce to assigned cohorts.")
            return attrs

        if target_type == "program":
            try:
                program = Program.objects.get(id=target_id)
            except (Program.DoesNotExist, ValueError) as exc:
                raise serializers.ValidationError({"target_id": "Program does not exist."}) from exc
            if user.role == UserRole.TEACHER and not program.cohorts.filter(teacher_assignments__teacher=user).exists():
                raise PermissionDenied("Teachers can only announce to programs they teach.")
            return attrs

        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.program_id:
            data["target_type"] = "program"
            data["target_id"] = str(instance.program_id)
        elif instance.cohort_id:
            data["target_type"] = "cohort"
            data["target_id"] = str(instance.cohort_id)
        else:
            data["target_type"] = "system"
            data["target_id"] = None
        return data

    def create(self, validated_data):
        target_type = validated_data.pop("target_type")
        target_id = validated_data.pop("target_id", None)
        if target_type == "program":
            validated_data["program_id"] = target_id
        elif target_type == "cohort":
            validated_data["cohort_id"] = target_id
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)
