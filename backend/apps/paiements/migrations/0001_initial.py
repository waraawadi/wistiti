from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Plan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nom", models.CharField(max_length=120, unique=True)),
                ("prix_xof", models.PositiveIntegerField()),
                ("nb_uploads_max", models.IntegerField(default=-1)),
                ("duree_jours", models.PositiveIntegerField(default=30)),
                ("hq_enabled", models.BooleanField(default=True)),
                ("moderation_enabled", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="Paiement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("montant", models.PositiveIntegerField()),
                ("devise", models.CharField(default="XOF", max_length=10)),
                ("statut", models.CharField(max_length=40)),
                ("fedapay_transaction_id", models.CharField(blank=True, default="", max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="paiements", to="accounts.user")),
                ("plan", models.ForeignKey(on_delete=models.deletion.PROTECT, related_name="paiements", to="paiements.plan")),
            ],
        ),
    ]

