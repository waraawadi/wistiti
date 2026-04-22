from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

import apps.evenements.models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Evenement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titre", models.CharField(max_length=255)),
                ("slug", models.SlugField(blank=True, max_length=255, unique=True)),
                ("date", models.DateTimeField()),
                ("description", models.TextField(blank=True, default="")),
                ("couleur_theme", models.CharField(blank=True, default="", max_length=7)),
                ("bg_image", models.ImageField(blank=True, null=True, upload_to="evenements/bg/")),
                ("actif", models.BooleanField(default=True)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="evenements", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Media",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("fichier", models.FileField(upload_to=apps.evenements.models.media_upload_to)),
                ("type", models.CharField(choices=[("photo", "Photo"), ("video", "Vidéo")], max_length=10)),
                ("legende", models.CharField(blank=True, default="", max_length=255)),
                ("approuve", models.BooleanField(default=False)),
                ("uploaded_by_ip", models.GenericIPAddressField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("evenement", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="medias", to="evenements.evenement")),
            ],
        ),
        migrations.CreateModel(
            name="TextPost",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("contenu", models.TextField()),
                ("style_decoration", models.CharField(blank=True, default="", max_length=80)),
                ("approuve", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("evenement", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="text_posts", to="evenements.evenement")),
            ],
        ),
        migrations.CreateModel(
            name="QRCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image_path", models.ImageField(upload_to=apps.evenements.models.qrcode_upload_to)),
                ("url_cible", models.URLField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("evenement", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="qrcode", to="evenements.evenement")),
            ],
        ),
    ]

