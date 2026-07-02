from django.contrib.auth.models import UserManager as DjangoUserManager

from accounts.choices import UserRole, UserStatus


class UserManager(DjangoUserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.SUPER_ADMIN)
        extra_fields.setdefault("status", UserStatus.ACTIVE)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return super().create_superuser(username, email=email, password=password, **extra_fields)

