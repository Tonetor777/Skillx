from rest_framework import serializers

from accounts.serializers import CurrentUserSerializer
from applications.models import Application, ExperienceLevel, Invitation
from applications.services import accept_invitation


class ApplicationSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    age = serializers.IntegerField(min_value=13, max_value=120)
    experience = serializers.ChoiceField(choices=ExperienceLevel.choices)
    program_id = serializers.CharField(write_only=True)
    program_name = serializers.CharField(source="program.title", read_only=True)
    status = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source="submitted_at", read_only=True)
    reviewed_by_id = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "program_id",
            "program_name",
            "phone",
            "age",
            "experience",
            "expectations",
            "status",
            "created_at",
            "reviewed_by_id",
            "reviewed_by_name",
            "reviewed_at",
        ]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_status(self, obj) -> str:
        return obj.status.lower()

    def get_reviewed_by_id(self, obj) -> str | None:
        return str(obj.reviewed_by_id) if obj.reviewed_by_id else None

    def get_reviewed_by_name(self, obj) -> str | None:
        if not obj.reviewed_by:
            return None
        name = f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip()
        return name or obj.reviewed_by.email

    def to_representation(self, instance):
        data = super().to_representation(instance)
        first, _, last = instance.name.partition(" ")
        data["first_name"] = first
        data["last_name"] = last
        data["program_id"] = str(instance.program_id)
        return data

    def validate(self, attrs):
        first_name = attrs.pop("first_name", "").strip()
        last_name = attrs.pop("last_name", "").strip()
        attrs["name"] = f"{first_name} {last_name}".strip()
        if not attrs["name"]:
            raise serializers.ValidationError({"first_name": "Applicant name is required."})
        return attrs


class InvitationSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    cohort_id = serializers.SerializerMethodField()
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Invitation
        fields = ["id", "email", "cohort_id", "cohort_name", "status", "expires_at", "accepted_at"]

    def get_id(self, obj) -> str:
        return str(obj.id)

    def get_cohort_id(self, obj) -> str:
        return str(obj.cohort_id)

    def get_status(self, obj) -> str:
        return obj.status.lower()


class InvitationAcceptSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    user = serializers.SerializerMethodField(read_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def save(self, **kwargs):
        self.instance = accept_invitation(self.validated_data["token"], self.validated_data["password"])
        return self.instance

    def get_user(self, obj):
        return CurrentUserSerializer(obj, context=self.context).data
