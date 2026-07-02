from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("learning", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Submission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("primary_link", models.URLField()),
                ("secondary_link", models.URLField(blank=True)),
                ("notes", models.TextField(blank=True)),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("is_late", models.BooleanField(default=False)),
                ("is_locked", models.BooleanField(default=False)),
                ("score", models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ("feedback", models.TextField(blank=True)),
                ("graded_at", models.DateTimeField(blank=True, null=True)),
                ("graded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="graded_submissions", to=settings.AUTH_USER_MODEL)),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="submissions", to=settings.AUTH_USER_MODEL)),
                ("week", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="submissions", to="learning.week")),
            ],
            options={"ordering": ["-submitted_at"], "unique_together": {("week", "student")}},
        ),
    ]

