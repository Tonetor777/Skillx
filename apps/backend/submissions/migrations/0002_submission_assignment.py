from django.db import migrations, models
import django.db.models.deletion


def create_assignments_for_existing_submissions(apps, schema_editor):
    Submission = apps.get_model("submissions", "Submission")
    Assignment = apps.get_model("learning", "Assignment")

    for submission in Submission.objects.select_related("week", "student").filter(assignment__isnull=True):
        week = submission.week
        assignment, _ = Assignment.objects.get_or_create(
            cohort_id=week.cohort_id,
            week=week,
            week_number=week.week_number,
            title=week.title or f"Week {week.week_number} Assignment",
            defaults={
                "description": week.assignment or week.objectives or "Migrated week assignment.",
                "max_points": 100,
                "due_date": submission.submitted_at,
                "created_by_id": week.created_by_id,
            },
        )
        submission.assignment = assignment
        submission.save(update_fields=["assignment"])


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0002_assignment"),
        ("submissions", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="submission",
            name="assignment",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="submissions", to="learning.assignment"),
        ),
        migrations.RunPython(create_assignments_for_existing_submissions, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(name="submission", unique_together={("assignment", "student")}),
        migrations.RemoveField(model_name="submission", name="week"),
        migrations.AlterField(
            model_name="submission",
            name="assignment",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="submissions", to="learning.assignment"),
        ),
        migrations.AlterField(
            model_name="submission",
            name="primary_link",
            field=models.TextField(),
        ),
    ]
