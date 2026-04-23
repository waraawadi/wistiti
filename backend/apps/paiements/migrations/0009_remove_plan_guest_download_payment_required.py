from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("paiements", "0008_plan_guest_download_payment_required"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="plan",
            name="guest_download_payment_required",
        ),
    ]

