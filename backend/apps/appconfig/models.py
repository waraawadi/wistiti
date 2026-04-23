from django.db import models


class AppConfig(models.Model):
    """Singleton : une seule ligne (pk=1) pour la config branding."""

    app_name = models.CharField(max_length=255, default="PhotoEvent")
    color_primary = models.CharField(max_length=7, default="#d2016f")
    color_secondary = models.CharField(max_length=7, default="#4e07d9")
    color_white = models.CharField(max_length=7, default="#ffffff")
    logo_url = models.URLField(blank=True, default="")
    favicon_url = models.URLField(blank=True, default="")
    topup_price_per_photo_xof = models.PositiveIntegerField(default=25)
    guest_download_price_per_photo_xof = models.PositiveIntegerField(default=25)
    guest_download_payment_required = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuration de l'application"
        verbose_name_plural = "Configuration de l'application"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        return None

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
