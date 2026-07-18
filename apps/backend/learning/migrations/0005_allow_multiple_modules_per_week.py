from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0004_lessonimage"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="module",
            options={"ordering": ["cohort", "module_number", "title", "id"]},
        ),
        migrations.AlterUniqueTogether(
            name="module",
            unique_together=set(),
        ),
    ]
