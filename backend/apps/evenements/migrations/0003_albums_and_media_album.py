from django.db import migrations, models
import django.db.models.deletion

import apps.evenements.models


def create_default_public_albums(apps, schema_editor):
    Evenement = apps.get_model("evenements", "Evenement")
    Album = apps.get_model("evenements", "Album")
    Media = apps.get_model("evenements", "Media")
    db = schema_editor.connection.alias

    for evt in Evenement.objects.using(db).all().iterator():
        album, _ = Album.objects.using(db).get_or_create(
            evenement_id=evt.id,
            slug="public",
            defaults={"nom": "Public", "is_public": True},
        )
        Media.objects.using(db).filter(evenement_id=evt.id, album__isnull=True).update(album_id=album.id)


class Migration(migrations.Migration):
    dependencies = [
        ("evenements", "0002_moderation_and_thumbnail_and_indexes"),
    ]

    operations = [
        migrations.CreateModel(
            name="Album",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nom", models.CharField(max_length=120)),
                ("slug", models.SlugField(max_length=140)),
                ("is_public", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "evenement",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="albums", to="evenements.evenement"
                    ),
                ),
            ],
            options={
                "unique_together": {("evenement", "slug")},
            },
        ),
        migrations.CreateModel(
            name="AlbumQRCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image_path", models.ImageField(upload_to=apps.evenements.models.album_qrcode_upload_to)),
                ("url_cible", models.URLField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "album",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, related_name="qrcode", to="evenements.album"
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="media",
            name="album",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="medias",
                to="evenements.album",
            ),
        ),
        migrations.AddIndex(
            model_name="album",
            index=models.Index(fields=["evenement", "slug"], name="evenements_al_eveneme_daaaf5_idx"),
        ),
        migrations.RunPython(create_default_public_albums, migrations.RunPython.noop),
    ]

