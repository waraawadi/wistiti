from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("paiements", "0002_paiement_expires_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="plan",
            name="nb_evenements_max",
            field=models.IntegerField(default=-1),
        ),
        migrations.AddField(
            model_name="plan",
            name="moderation_avancee",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="plan",
            name="support_prioritaire",
            field=models.BooleanField(default=False),
        ),
    ]

