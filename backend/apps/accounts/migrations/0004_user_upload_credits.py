from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_user_expires_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="upload_credits",
            field=models.PositiveIntegerField(default=0),
        ),
    ]

