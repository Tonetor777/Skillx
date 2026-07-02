from django.contrib import admin

from announcements.models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "program", "cohort", "scheduled_for", "created_by")
    list_filter = ("program", "cohort")
    search_fields = ("title", "message")

