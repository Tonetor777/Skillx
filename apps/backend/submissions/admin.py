from django.contrib import admin

from submissions.models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "assignment", "score", "is_late", "is_locked", "submitted_at")
    list_filter = ("is_late", "is_locked", "assignment__cohort")
    search_fields = ("student__email", "assignment__title", "primary_link")
