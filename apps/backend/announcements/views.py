from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.choices import UserRole
from accounts.permissions import IsActiveUser, IsTeacherAdminOrSuperAdmin
from announcements.models import Announcement, AnnouncementRead
from announcements.serializers import AnnouncementSerializer


class AnnouncementViewSet(ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "head", "options"]

    def get_visible_queryset(self, *, apply_filters=True):
        if getattr(self, "swagger_fake_view", False):
            return Announcement.objects.none()
        user = self.request.user
        queryset = Announcement.objects.select_related("program", "cohort", "created_by").filter(
            Q(scheduled_for__isnull=True) | Q(scheduled_for__lte=timezone.now())
        )
        if apply_filters:
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

    def get_queryset(self):
        return self.get_visible_queryset()

    def get_permissions(self):
        if self.action == "create":
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        announcement = self.get_object()
        AnnouncementRead.objects.get_or_create(announcement=announcement, user=request.user)
        return Response({"is_read": True})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        visible_ids = list(self.get_visible_queryset(apply_filters=False).values_list("id", flat=True))
        AnnouncementRead.objects.bulk_create(
            [AnnouncementRead(announcement_id=announcement_id, user=request.user) for announcement_id in visible_ids],
            ignore_conflicts=True,
        )
        return Response({"marked_read": len(visible_ids), "count": 0})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = self.get_visible_queryset(apply_filters=False).exclude(read_receipts__user=request.user).count()
        return Response({"count": count})
