from django.db import models


class UserRole(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    ADMIN = "ADMIN", "Admin"
    TEACHER = "TEACHER", "Teacher"
    STUDENT = "STUDENT", "Student"


class UserStatus(models.TextChoices):
    UNVERIFIED = "UNVERIFIED", "Unverified"
    PENDING = "PENDING", "Pending"
    ACTIVE = "ACTIVE", "Active"
    REJECTED = "REJECTED", "Rejected"
    SUSPENDED = "SUSPENDED", "Suspended"

