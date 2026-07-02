from django.contrib.auth.models import AbstractUser
from django.db import models

from accounts.choices import UserRole, UserStatus
from accounts.managers import UserManager


class User(AbstractUser):
    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=32, choices=UserRole.choices, default=UserRole.STUDENT)
    status = models.CharField(max_length=32, choices=UserStatus.choices, default=UserStatus.UNVERIFIED)
    photo = models.ImageField(upload_to="profiles/", blank=True, null=True)
    bio = models.TextField(blank=True)
    cohort = models.ForeignKey(
        "cohorts.Cohort",
        on_delete=models.SET_NULL,
        related_name="students",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
    objects = UserManager()

    @property
    def is_active_student(self) -> bool:
        return self.role == UserRole.STUDENT and self.status == UserStatus.ACTIVE and self.cohort_id is not None
