from django.db import migrations, models
import apps.evenements.models


class Migration(migrations.Migration):
    dependencies = [
        ("evenements", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="evenement",
            name="moderation_active",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="media",
            name="thumbnail",
            field=models.ImageField(blank=True, null=True, upload_to=apps.evenements.models.thumb_upload_to),
        ),
        migrations.AddIndex(
            model_name="evenement",
            index=models.Index(fields=["slug"], name="evt_slug_idx"),
        ),
        migrations.AddIndex(
            model_name="media",
            index=models.Index(fields=["evenement", "approuve"], name="media_evt_app_idx"),
        ),
        migrations.AddIndex(
            model_name="media",
            index=models.Index(fields=["created_at"], name="media_created_idx"),
        ),
    ]

