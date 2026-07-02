from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="PlatformSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("branding_name", models.CharField(default="Skilix LMS", max_length=255)),
                ("theme", models.CharField(default="zinc", max_length=32)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Platform settings",
                "verbose_name_plural": "Platform settings",
            },
        ),
    ]
