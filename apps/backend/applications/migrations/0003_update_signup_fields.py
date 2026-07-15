from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0002_remove_application_document_uploads"),
    ]

    operations = [
        migrations.AddField(
            model_name="application",
            name="age",
            field=models.PositiveSmallIntegerField(default=18),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="application",
            name="experience",
            field=models.CharField(
                choices=[
                    ("BEGINNER", "Beginner"),
                    ("INTERMEDIATE", "Intermediate"),
                    ("ADVANCED", "Advanced"),
                    ("PROFESSIONAL", "Professional"),
                ],
                max_length=32,
            ),
        ),
        migrations.RenameField(
            model_name="application",
            old_name="motivation",
            new_name="expectations",
        ),
        migrations.RemoveField(
            model_name="application",
            name="country",
        ),
    ]
