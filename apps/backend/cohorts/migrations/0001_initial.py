from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("programs", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Cohort",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField()),
                ("duration_weeks", models.PositiveIntegerField(default=12)),
                ("current_week", models.PositiveIntegerField(default=1)),
                ("leaderboard_visible", models.BooleanField(default=True)),
                ("status", models.CharField(choices=[("DRAFT", "Draft"), ("ACTIVE", "Active"), ("COMPLETED", "Completed"), ("ARCHIVED", "Archived")], default="DRAFT", max_length=32)),
                ("program", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="cohorts", to="programs.program")),
            ],
            options={"ordering": ["-start_date", "name"], "unique_together": {("program", "name")}},
        ),
        migrations.CreateModel(
            name="TeacherAssignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("LEAD", "Lead Teacher"), ("ASSISTANT", "Assistant Teacher"), ("MENTOR", "Mentor")], max_length=32)),
                ("assigned_at", models.DateTimeField(auto_now_add=True)),
                ("cohort", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="teacher_assignments", to="cohorts.cohort")),
                ("teacher", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="teaching_assignments", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["cohort", "role"], "unique_together": {("teacher", "cohort", "role")}},
        ),
    ]

