from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("paiements", "0003_plan_features"),
    ]

    operations = [
        migrations.AddField(
            model_name="plan",
            name="nb_albums_max",
            field=models.IntegerField(default=2),
        ),
    ]

