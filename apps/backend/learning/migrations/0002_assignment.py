from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("cohorts", "0001_initial"),
        ("learning", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Assignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField()),
                ("max_points", models.PositiveIntegerField(default=100)),
                ("due_date", models.DateTimeField()),
                ("week_number", models.PositiveIntegerField(default=1)),
                ("is_locked", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("cohort", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="assignments", to="cohorts.cohort")),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="created_assignments", to=settings.AUTH_USER_MODEL)),
                ("week", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assignments", to="learning.week")),
            ],
            options={"ordering": ["cohort", "week_number", "due_date"]},
        ),
    ]
