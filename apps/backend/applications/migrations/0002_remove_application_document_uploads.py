from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="application",
            name="payment_proof",
        ),
        migrations.RemoveField(
            model_name="application",
            name="resume",
        ),
    ]
