from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from accounts.models import User


@admin.register(User)
class SkilixUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Skilix", {"fields": ("name", "role", "status", "photo", "bio", "cohort")}),
    )
    list_display = ("email", "username", "role", "status", "is_staff")
    list_filter = ("role", "status", "is_staff", "is_superuser")
    search_fields = ("email", "username", "name")

