from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("paiements", "0007_guest_download_purchase"),
    ]

    operations = [
        migrations.AddField(
            model_name="plan",
            name="guest_download_payment_required",
            field=models.BooleanField(default=True),
        ),
    ]

