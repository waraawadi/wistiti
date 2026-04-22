from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
        ("paiements", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="plan_actif",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="users",
                to="paiements.plan",
            ),
        ),
    ]

