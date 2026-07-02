from datetime import date, datetime, time

from django.utils import timezone
from rest_framework import serializers

from cohorts.models import Cohort
from learning.models import Assignment, Resource, Week, WeekStatus


class ResourceSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    week_id = serializers.CharField(write_only=True)

    class Meta:
        model = Resource
        fields = ["id", "week_id", "title", "url", "order"]

    def get_id(self, obj):
        return str(obj.id)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["week_id"] = str(instance.week_id)
        return data


class WeekSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    cohort_id = serializers.CharField(write_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    resources = ResourceSerializer(many=True, read_only=True)
    status = serializers.CharField(required=False)
    published_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Week
        fields = [
            "id",
            "cohort_id",
            "cohort_name",
            "week_number",
            "title",
            "objectives",
            "notes",
            "assignment",
            "recording",
            "status",
            "publish_date",
            "published_by_name",
            "resources",
        ]
        read_only_fields = ["id", "cohort_name", "publish_date", "published_by_name", "resources"]

    def get_id(self, obj):
        return str(obj.id)

    def get_published_by_name(self, obj):
        if not obj.published_by:
            return None
        name = f"{obj.published_by.first_name} {obj.published_by.last_name}".strip()
        return name or obj.published_by.email

    def validate_status(self, value):
        normalized = value.upper()
        if normalized not in WeekStatus.values:
            raise serializers.ValidationError("Week status is invalid.")
        return normalized

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
    cohort_id = serializers.CharField(write_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    due_date = FlexibleDueDateField()

    class Meta:
        model = Assignment
        fields = [
            "id",
            "title",
            "description",
            "max_points",
            "due_date",
            "week_number",
            "cohort_id",
            "cohort_name",
            "is_locked",
        ]
        read_only_fields = ["id", "cohort_name", "is_locked"]

    def get_id(self, obj):
        return str(obj.id)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["cohort_id"] = str(instance.cohort_id)
        return data

    def create(self, validated_data):
        request = self.context["request"]
        cohort = Cohort.objects.get(id=validated_data["cohort_id"])
        week_number = validated_data.get("week_number") or 1
        week, _ = Week.objects.get_or_create(
            cohort=cohort,
            week_number=week_number,
            defaults={
                "title": f"Week {week_number}",
                "objectives": "",
                "status": WeekStatus.PUBLISHED,
                "created_by": request.user,
            },
        )
        validated_data["week"] = week
        validated_data["created_by"] = request.user
        return super().create(validated_data)
