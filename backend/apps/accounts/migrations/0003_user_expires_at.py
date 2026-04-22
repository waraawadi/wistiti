from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_user_plan_actif"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

