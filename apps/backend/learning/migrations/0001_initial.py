from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("cohorts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Week",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("week_number", models.PositiveIntegerField()),
                ("title", models.CharField(max_length=255)),
                ("objectives", models.TextField(blank=True)),
                ("notes", models.TextField(blank=True)),
                ("assignment", models.TextField(blank=True)),
                ("recording", models.URLField(blank=True)),
                ("status", models.CharField(choices=[("DRAFT", "Draft"), ("PUBLISHED", "Published"), ("ARCHIVED", "Archived")], default="DRAFT", max_length=32)),
                ("publish_date", models.DateTimeField(blank=True, null=True)),
                ("cohort", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="weeks", to="cohorts.cohort")),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="created_weeks", to=settings.AUTH_USER_MODEL)),
                ("published_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="published_weeks", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["cohort", "week_number"], "unique_together": {("cohort", "week_number")}},
        ),
        migrations.CreateModel(
            name="Resource",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("url", models.URLField()),
                ("order", models.PositiveIntegerField(default=0)),
                ("week", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="resources", to="learning.week")),
            ],
            options={"ordering": ["week", "order", "title"]},
        ),
    ]

