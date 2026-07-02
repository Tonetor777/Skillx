from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.choices import UserRole
from accounts.permissions import IsActiveUser, IsTeacherAdminOrSuperAdmin
from learning.models import Assignment, Resource, Week, WeekStatus
from learning.serializers import AssignmentSerializer, ResourceSerializer, WeekSerializer


def scope_queryset_to_user(queryset, user, cohort_field="cohort_id"):
    if user.role == UserRole.STUDENT:
        return queryset.filter(**{cohort_field: user.cohort_id})
    if user.role == UserRole.TEACHER:
        return queryset.filter(**{f"{cohort_field.replace('_id', '')}__teacher_assignments__teacher": user}).distinct()
    return queryset


class AssignmentViewSet(ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Assignment.objects.select_related("cohort", "week").prefetch_related("submissions")
        cohort_id = self.request.query_params.get("cohort_id")
        if cohort_id:
            queryset = queryset.filter(cohort_id=cohort_id)
        if user.role == UserRole.STUDENT:
            return queryset.filter(cohort_id=user.cohort_id)
        if user.role == UserRole.TEACHER:
            return queryset.filter(cohort__teacher_assignments__teacher=user).distinct()
        return queryset

    def get_permissions(self):
        if self.action in {"create", "partial_update"}:
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()


class WeekViewSet(ModelViewSet):
    serializer_class = WeekSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Week.objects.select_related("cohort", "published_by").prefetch_related("resources")
        cohort_id = self.request.query_params.get("cohort_id")
        if cohort_id:
            queryset = queryset.filter(cohort_id=cohort_id)
        queryset = scope_queryset_to_user(queryset, user)
        if user.role == UserRole.STUDENT:
            queryset = queryset.filter(status=WeekStatus.PUBLISHED)
        return queryset

    def get_permissions(self):
        if self.action in {"create", "partial_update", "destroy", "publish"}:
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        week = self.get_object()
        week.status = WeekStatus.PUBLISHED
        week.publish_date = timezone.now()
        week.published_by = request.user
        week.save(update_fields=["status", "publish_date", "published_by"])
        return Response(self.get_serializer(week).data)


class ResourceViewSet(ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Resource.objects.select_related("week", "week__cohort")
        week_id = self.request.query_params.get("week_id")
        if week_id:
            queryset = queryset.filter(week_id=week_id)
        if user.role == UserRole.STUDENT:
            return queryset.filter(week__cohort_id=user.cohort_id, week__status=WeekStatus.PUBLISHED)
        if user.role == UserRole.TEACHER:
            return queryset.filter(week__cohort__teacher_assignments__teacher=user).distinct()
        return queryset

    def get_permissions(self):
        if self.action in {"create", "partial_update", "destroy"}:
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()
