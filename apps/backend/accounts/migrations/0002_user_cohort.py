from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("cohorts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="cohort",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="students", to="cohorts.cohort"),
        ),
    ]

