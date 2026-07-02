import accounts.managers
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_user_cohort"),
    ]

    operations = [
        migrations.AlterModelManagers(
            name="user",
            managers=[
                ("objects", accounts.managers.UserManager()),
            ],
        ),
    ]

