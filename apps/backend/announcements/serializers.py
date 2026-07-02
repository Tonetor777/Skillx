from rest_framework import serializers

from announcements.models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    content = serializers.CharField(source="message")
    target_type = serializers.ChoiceField(choices=["system", "program", "cohort"], write_only=True)
    target_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, write_only=True)
    target_name = serializers.SerializerMethodField()
    author_id = serializers.SerializerMethodField()
    author_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()

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
            "scheduled_for",
            "created_at",
        ]
        read_only_fields = ["id", "target_name", "author_id", "author_name", "author_role", "created_at"]

    def get_id(self, obj):
        return str(obj.id)

    def get_target_name(self, obj):
        if obj.program:
            return obj.program.title
        if obj.cohort:
            return obj.cohort.name
        return "Global Broadcast"

    def get_author_id(self, obj):
        return str(obj.created_by_id)

    def get_author_name(self, obj):
        name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return name or obj.created_by.email

    def get_author_role(self, obj):
        return obj.created_by.role.lower()

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
