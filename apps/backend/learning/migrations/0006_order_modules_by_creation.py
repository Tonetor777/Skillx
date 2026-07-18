from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("learning", "0005_allow_multiple_modules_per_week"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="module",
            options={"ordering": ["cohort", "module_number", "id"]},
        ),
    ]
