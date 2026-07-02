from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("cohorts", "0001_initial"),
        ("programs", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Announcement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("message", models.TextField()),
                ("meeting_link", models.URLField(blank=True)),
                ("scheduled_for", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("cohort", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="announcements", to="cohorts.cohort")),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="announcements", to=settings.AUTH_USER_MODEL)),
                ("program", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="announcements", to="programs.program")),
            ],
            options={"ordering": ["-scheduled_for", "-created_at"]},
        ),
    ]

