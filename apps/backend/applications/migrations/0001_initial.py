from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("cohorts", "0001_initial"),
        ("programs", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Application",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254)),
                ("phone", models.CharField(max_length=64)),
                ("country", models.CharField(max_length=128)),
                ("experience", models.CharField(max_length=128)),
                ("motivation", models.TextField()),
                ("payment_proof", models.FileField(blank=True, null=True, upload_to="applications/payment-proofs/")),
                ("resume", models.FileField(blank=True, null=True, upload_to="applications/resumes/")),
                ("status", models.CharField(choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected"), ("WITHDRAWN", "Withdrawn")], default="PENDING", max_length=32)),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("program", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="applications", to="programs.program")),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_applications", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-submitted_at"]},
        ),
        migrations.CreateModel(
            name="Invitation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254)),
                ("token", models.CharField(max_length=128, unique=True)),
                ("expires_at", models.DateTimeField()),
                ("accepted_at", models.DateTimeField(blank=True, null=True)),
                ("status", models.CharField(choices=[("PENDING", "Pending"), ("ACCEPTED", "Accepted"), ("EXPIRED", "Expired"), ("REVOKED", "Revoked")], default="PENDING", max_length=32)),
                ("cohort", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="invitations", to="cohorts.cohort")),
            ],
            options={"ordering": ["-expires_at"]},
        ),
    ]

