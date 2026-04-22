import os
import re

from django.db import migrations


HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def seed_appconfig(apps, schema_editor):
    AppConfig = apps.get_model("appconfig", "AppConfig")

    # Singleton pk=1 : si déjà présent → rien à faire
    if AppConfig.objects.filter(pk=1).exists():
        return

    app_name = os.environ.get("APP_NAME", "").strip() or "PhotoEvent"
    color_primary = os.environ.get("COLOR_PRIMARY", "").strip() or "#d2016f"
    color_secondary = os.environ.get("COLOR_SECONDARY", "").strip() or "#4e07d9"
    color_white = os.environ.get("COLOR_WHITE", "").strip() or "#ffffff"

    # garde-fous: si env invalide, on retombe sur défauts
    if not HEX_RE.match(color_primary):
        color_primary = "#d2016f"
    if not HEX_RE.match(color_secondary):
        color_secondary = "#4e07d9"
    if not HEX_RE.match(color_white):
        color_white = "#ffffff"

    AppConfig.objects.create(
        pk=1,
        app_name=app_name,
        color_primary=color_primary,
        color_secondary=color_secondary,
        color_white=color_white,
        logo_url="",
        favicon_url="",
    )


class Migration(migrations.Migration):
    dependencies = [
        ("appconfig", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_appconfig, migrations.RunPython.noop),
    ]

