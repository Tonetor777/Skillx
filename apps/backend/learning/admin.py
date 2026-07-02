from django.contrib import admin

from learning.models import Assignment, Resource, Week


@admin.register(Week)
class WeekAdmin(admin.ModelAdmin):
    list_display = ("title", "cohort", "week_number", "status", "publish_date")
    list_filter = ("status", "cohort")
    search_fields = ("title", "cohort__name")


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "week", "order")
    search_fields = ("title", "url")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "cohort", "week_number", "due_date", "max_points", "is_locked")
    list_filter = ("cohort", "is_locked")
    search_fields = ("title", "description", "cohort__name")
