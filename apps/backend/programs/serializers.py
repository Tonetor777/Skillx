from rest_framework import serializers

from programs.models import Program, ProgramStatus


class ProgramSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    name = serializers.CharField(source="title")
    weeks = serializers.JSONField(source="syllabus", required=False)
    cohorts_count = serializers.IntegerField(source="cohorts.count", read_only=True)
    status = serializers.SerializerMethodField()
    cohorts = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = ["id", "name", "description", "weeks", "cohorts_count", "status", "cohorts", "created_at"]

    def get_id(self, obj):
        return str(obj.id)

    def get_status(self, obj):
        return obj.status.lower()

    def get_cohorts(self, obj):
        return [
            {
                "id": str(cohort.id),
                "name": cohort.name,
                "status": cohort.status.lower(),
                "current_week": cohort.current_week,
                "students_count": cohort.students.count(),
                "start_date": cohort.start_date.isoformat(),
                "end_date": cohort.end_date.isoformat(),
            }
            for cohort in obj.cohorts.all()
        ]

    def create(self, validated_data):
        title = validated_data.pop("title")
        slug_base = "".join(ch.lower() if ch.isalnum() else "-" for ch in title).strip("-") or "program"
        slug = slug_base
        counter = 2
        while Program.objects.filter(slug=slug).exists():
            slug = f"{slug_base}-{counter}"
            counter += 1
        return Program.objects.create(title=title, slug=slug, status=ProgramStatus.ACTIVE, **validated_data)
