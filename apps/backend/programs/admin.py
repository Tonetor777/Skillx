from django.contrib import admin

from programs.models import Program


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "level", "duration_weeks", "price")
    list_filter = ("status", "level")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title",)

