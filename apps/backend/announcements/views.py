from django.db.models import Q
from django.utils import timezone
from rest_framework.viewsets import ModelViewSet

from accounts.choices import UserRole
from accounts.permissions import IsActiveUser, IsTeacherAdminOrSuperAdmin
from announcements.models import Announcement
from announcements.serializers import AnnouncementSerializer


class AnnouncementViewSet(ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Announcement.objects.select_related("program", "cohort", "created_by").filter(
            Q(scheduled_for__isnull=True) | Q(scheduled_for__lte=timezone.now())
        )
        target_type = self.request.query_params.get("target_type")
        target_id = self.request.query_params.get("target_id")
        if target_type == "program":
            queryset = queryset.filter(program_id=target_id)
        elif target_type == "cohort":
            queryset = queryset.filter(cohort_id=target_id)
        elif target_type == "system":
            queryset = queryset.filter(program__isnull=True, cohort__isnull=True)

        if user.role == UserRole.STUDENT:
            return queryset.filter(
                Q(program__isnull=True, cohort__isnull=True)
                | Q(cohort_id=user.cohort_id)
                | Q(program_id=user.cohort.program_id if user.cohort_id else None)
            )
        if user.role == UserRole.TEACHER:
            return queryset.filter(
                Q(program__isnull=True, cohort__isnull=True)
                | Q(cohort__teacher_assignments__teacher=user)
                | Q(program__cohorts__teacher_assignments__teacher=user)
            ).distinct()
        return queryset

    def get_permissions(self):
        if self.action == "create":
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()
