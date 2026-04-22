from rest_framework import serializers

from .models import AppConfig


class AppConfigPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppConfig
        fields = (
            "app_name",
            "color_primary",
            "color_secondary",
            "color_white",
            "logo_url",
        )


class AppConfigUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppConfig
        fields = (
            "app_name",
            "color_primary",
            "color_secondary",
            "color_white",
            "logo_url",
            "favicon_url",
        )
