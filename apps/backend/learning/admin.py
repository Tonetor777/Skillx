from django.contrib import admin

from learning.models import Assignment, Lesson, Module, Resource


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "cohort", "module_number", "status", "publish_date")
    list_filter = ("status", "cohort")
    search_fields = ("title", "cohort__name")


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "order")
    search_fields = ("title", "module__title", "module__cohort__name")


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "lesson", "order")
    search_fields = ("title", "url")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "cohort", "module", "lesson", "resource", "due_date", "max_points", "is_locked")
    list_filter = ("cohort", "is_locked")
    search_fields = ("title", "description", "cohort__name")
