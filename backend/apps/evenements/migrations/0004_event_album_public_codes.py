import random
import string

from django.db import migrations, models


def _rand_code():
    letters = "".join(random.choices(string.ascii_uppercase, k=3))
    digits = "".join(random.choices(string.digits, k=3))
    return letters + digits


def fill_codes(apps, schema_editor):
    Evenement = apps.get_model("evenements", "Evenement")
    Album = apps.get_model("evenements", "Album")
    db = schema_editor.connection.alias

    used_events = set(Evenement.objects.using(db).exclude(public_code__isnull=True).values_list("public_code", flat=True))
    for evt in Evenement.objects.using(db).all().iterator():
        if evt.public_code:
            continue
        for _ in range(10000):
            c = _rand_code()
            if c not in used_events:
                evt.public_code = c
                evt.save(update_fields=["public_code"])
                used_events.add(c)
                break

    for alb in Album.objects.using(db).all().iterator():
        if alb.public_code:
            continue
        used_local = set(
            Album.objects.using(db).filter(evenement_id=alb.evenement_id).exclude(pk=alb.pk).values_list("public_code", flat=True)
        )
        for _ in range(10000):
            c = _rand_code()
            if c not in used_local:
                alb.public_code = c
                alb.save(update_fields=["public_code"])
                used_local.add(c)
                break


class Migration(migrations.Migration):
    dependencies = [
        ("evenements", "0003_albums_and_media_album"),
    ]

    operations = [
        migrations.AddField(
            model_name="evenement",
            name="public_code",
            field=models.CharField(blank=True, default="", max_length=6, null=True),
        ),
        migrations.AddField(
            model_name="album",
            name="public_code",
            field=models.CharField(blank=True, default="", max_length=6),
        ),
        migrations.RunPython(fill_codes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="evenement",
            name="public_code",
            field=models.CharField(default="", max_length=6, unique=True),
        ),
        migrations.AlterField(
            model_name="album",
            name="public_code",
            field=models.CharField(default="", max_length=6),
        ),
        migrations.AddConstraint(
            model_name="album",
            constraint=models.UniqueConstraint(fields=("evenement", "public_code"), name="uniq_album_pubcode_per_event"),
        ),
    ]
