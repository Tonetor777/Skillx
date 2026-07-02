from django.contrib import admin

from cohorts.models import Cohort, TeacherAssignment


@admin.register(Cohort)
class CohortAdmin(admin.ModelAdmin):
    list_display = ("name", "program", "status", "start_date", "end_date", "current_week")
    list_filter = ("status", "program")
    search_fields = ("name", "program__title")


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ("teacher", "cohort", "role", "assigned_at")
    list_filter = ("role", "cohort")
    search_fields = ("teacher__email", "cohort__name")

