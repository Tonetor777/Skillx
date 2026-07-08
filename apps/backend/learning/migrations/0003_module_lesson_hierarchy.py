from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def create_default_lessons(apps, schema_editor):
    Module = apps.get_model("learning", "Module")
    Lesson = apps.get_model("learning", "Lesson")

    for module in Module.objects.order_by():
        Lesson.objects.get_or_create(
            module=module,
            order=1,
            defaults={
                "title": module.title,
                "objectives": module.description,
                "content": module.notes,
                "recording": getattr(module, "recording", ""),
            },
        )


def attach_content_to_lessons(apps, schema_editor):
    Lesson = apps.get_model("learning", "Lesson")
    Resource = apps.get_model("learning", "Resource")
    Assignment = apps.get_model("learning", "Assignment")

    lessons_by_module = {lesson.module_id: lesson for lesson in Lesson.objects.order_by()}

    for resource in Resource.objects.order_by():
        lesson = lessons_by_module.get(resource.week_id)
        if lesson:
            resource.lesson_id = lesson.id
            resource.save(update_fields=["lesson"])

    for assignment in Assignment.objects.order_by():
        module = assignment.week
        lesson = lessons_by_module.get(module.id) if module else None
        assignment.module = module
        assignment.lesson = lesson
        assignment.save(update_fields=["module", "lesson"])


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("learning", "0002_assignment"),
        ("submissions", "0002_submission_assignment"),
    ]

    operations = [
        migrations.RenameModel(old_name="Week", new_name="Module"),
        migrations.RenameField(model_name="module", old_name="week_number", new_name="module_number"),
        migrations.RenameField(model_name="module", old_name="objectives", new_name="description"),
        migrations.CreateModel(
            name="Lesson",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("objectives", models.TextField(blank=True)),
                ("content", models.TextField(blank=True)),
                ("recording", models.URLField(blank=True)),
                ("order", models.PositiveIntegerField(default=0)),
                ("module", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lessons", to="learning.module")),
            ],
            options={"ordering": ["module", "order", "title"], "unique_together": {("module", "order")}},
        ),
        migrations.RunPython(create_default_lessons, migrations.RunPython.noop),
        migrations.AddField(
            model_name="resource",
            name="lesson",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="resources", to="learning.lesson"),
        ),
        migrations.AddField(
            model_name="assignment",
            name="module",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assignments", to="learning.module"),
        ),
        migrations.AddField(
            model_name="assignment",
            name="lesson",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assignments", to="learning.lesson"),
        ),
        migrations.AddField(
            model_name="assignment",
            name="resource",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assignments", to="learning.resource"),
        ),
        migrations.RunPython(attach_content_to_lessons, migrations.RunPython.noop),
        migrations.RemoveField(model_name="resource", name="week"),
        migrations.AlterField(
            model_name="resource",
            name="lesson",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="resources", to="learning.lesson"),
        ),
        migrations.RemoveField(model_name="assignment", name="week"),
        migrations.RemoveField(model_name="assignment", name="week_number"),
        migrations.RemoveField(model_name="module", name="assignment"),
        migrations.RemoveField(model_name="module", name="recording"),
        migrations.AlterField(
            model_name="module",
            name="cohort",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="modules", to="cohorts.cohort"),
        ),
        migrations.AlterField(
            model_name="module",
            name="created_by",
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="created_modules", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name="module",
            name="published_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="published_modules", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterModelOptions(name="module", options={"ordering": ["cohort", "module_number"]}),
        migrations.AlterModelOptions(name="resource", options={"ordering": ["lesson", "order", "title"]}),
        migrations.AlterModelOptions(name="assignment", options={"ordering": ["cohort", "module__module_number", "lesson__order", "due_date"]}),
        migrations.AlterUniqueTogether(name="module", unique_together={("cohort", "module_number")}),
    ]
