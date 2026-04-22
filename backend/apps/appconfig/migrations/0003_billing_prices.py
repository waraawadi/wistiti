from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("appconfig", "0002_seed_appconfig_from_env"),
    ]

    operations = [
        migrations.AddField(
            model_name="appconfig",
            name="topup_price_per_photo_xof",
            field=models.PositiveIntegerField(default=25),
        ),
        migrations.AddField(
            model_name="appconfig",
            name="guest_download_price_per_photo_xof",
            field=models.PositiveIntegerField(default=25),
        ),
    ]

