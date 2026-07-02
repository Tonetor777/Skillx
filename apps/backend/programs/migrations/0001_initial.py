from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Program",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("slug", models.SlugField(unique=True)),
                ("description", models.TextField(blank=True)),
                ("duration_weeks", models.PositiveIntegerField(default=12)),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("level", models.CharField(choices=[("BEGINNER", "Beginner"), ("INTERMEDIATE", "Intermediate"), ("ADVANCED", "Advanced")], default="BEGINNER", max_length=32)),
                ("thumbnail", models.ImageField(blank=True, null=True, upload_to="programs/")),
                ("status", models.CharField(choices=[("DRAFT", "Draft"), ("ACTIVE", "Active"), ("ARCHIVED", "Archived")], default="DRAFT", max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["title"]},
        ),
    ]

