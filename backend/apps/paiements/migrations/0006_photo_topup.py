from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("paiements", "0005_paiement_months_paid"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PhotoTopUp",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField()),
                ("price_per_photo_xof", models.PositiveIntegerField()),
                ("montant", models.PositiveIntegerField()),
                ("statut", models.CharField(default="pending", max_length=40)),
                ("fedapay_transaction_id", models.CharField(blank=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="photo_topups",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]

