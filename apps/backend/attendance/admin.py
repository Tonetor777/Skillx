from django.contrib import admin

from attendance.models import AttendanceRecord, AttendanceSession


@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ("cohort", "date", "title", "recorded_by", "created_at")
    list_filter = ("cohort", "date")
    search_fields = ("title", "cohort__name")


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ("student", "session", "status", "recorded_by", "updated_at")
    list_filter = ("status", "session__cohort")
    search_fields = ("student__email", "student__first_name", "student__last_name")
