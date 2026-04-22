from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("paiements", "0006_photo_topup"),
    ]

    operations = [
        migrations.CreateModel(
            name="GuestDownloadPurchase",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user_email", models.EmailField(blank=True, default="", max_length=254)),
                ("media_ids", models.JSONField(default=list)),
                ("montant", models.PositiveIntegerField()),
                ("price_per_photo_xof", models.PositiveIntegerField()),
                ("statut", models.CharField(default="pending", max_length=40)),
                ("fedapay_transaction_id", models.CharField(blank=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("used_at", models.DateTimeField(blank=True, null=True)),
            ],
        ),
    ]

