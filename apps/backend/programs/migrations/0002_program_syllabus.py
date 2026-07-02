from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("programs", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="program",
            name="syllabus",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
