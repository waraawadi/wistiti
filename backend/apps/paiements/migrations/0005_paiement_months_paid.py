from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("paiements", "0004_plan_nb_albums_max"),
    ]

    operations = [
        migrations.AddField(
            model_name="paiement",
            name="months_paid",
            field=models.PositiveIntegerField(default=1),
        ),
    ]

