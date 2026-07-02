from django.contrib import admin

from applications.models import Application, Invitation


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "program", "status", "submitted_at")
    list_filter = ("status", "program")
    search_fields = ("name", "email")


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ("email", "cohort", "status", "expires_at", "accepted_at")
    list_filter = ("status", "cohort")
    search_fields = ("email", "token")

