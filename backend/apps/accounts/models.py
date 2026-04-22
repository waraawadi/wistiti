from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("Un email est requis.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Le superuser doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Le superuser doit avoir is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=255, blank=True, default="")
    plan_actif = models.ForeignKey(
        "paiements.Plan",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users",
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    expires_at = models.DateTimeField(blank=True, null=True)
    upload_credits = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    def get_effective_plan(self):
        """
        Plan réellement actif pour la logique métier.

        - `plan_actif` absent => gratuit
        - `expires_at` dépassé => gratuit
        - `expires_at` null => plan considéré actif
        """
        plan = self.plan_actif
        if not plan:
            return None
        if self.expires_at and self.expires_at <= timezone.now():
            return None
        return plan

    def __str__(self) -> str:
        return self.email
