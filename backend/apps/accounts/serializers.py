from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "nom", "password")

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        # SimpleJWT appelle authenticate() avec username_field -> email
        data = super().validate(attrs)
        effective_plan = self.user.get_effective_plan()
        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "nom": self.user.nom,
            "is_superuser": bool(getattr(self.user, "is_superuser", False)),
            "plan_actif": getattr(effective_plan, "nom", None),
            "expires_at": self.user.expires_at.isoformat() if self.user.expires_at else None,
        }
        return data


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        user = authenticate(email=attrs["email"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Identifiants invalides.")
        attrs["user"] = user
        return attrs

