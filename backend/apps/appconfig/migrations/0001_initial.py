from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="AppConfig",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("app_name", models.CharField(default="PhotoEvent", max_length=255)),
                ("color_primary", models.CharField(default="#d2016f", max_length=7)),
                ("color_secondary", models.CharField(default="#4e07d9", max_length=7)),
                ("color_white", models.CharField(default="#ffffff", max_length=7)),
                ("logo_url", models.URLField(blank=True, default="")),
                ("favicon_url", models.URLField(blank=True, default="")),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Configuration de l'application",
                "verbose_name_plural": "Configuration de l'application",
            },
        ),
    ]
