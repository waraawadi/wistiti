from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("appconfig", "0003_billing_prices"),
    ]

    operations = [
        migrations.AddField(
            model_name="appconfig",
            name="guest_download_payment_required",
            field=models.BooleanField(default=True),
        ),
    ]

