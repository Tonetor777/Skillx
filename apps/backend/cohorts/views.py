from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.choices import UserRole
from accounts.permissions import IsActiveUser, IsAdminOrSuperAdmin, IsTeacherAdminOrSuperAdmin
from cohorts.models import Cohort, TeacherAssignment
from cohorts.serializers import CohortGradeSettingsSerializer, CohortSerializer, TeacherAssignmentSerializer
from cohorts.services import delete_empty_cohort


class CohortViewSet(ModelViewSet):
    serializer_class = CohortSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Cohort.objects.none()
        user = self.request.user
        queryset = Cohort.objects.select_related("program").prefetch_related("students", "teacher_assignments__teacher")
        if user.role == UserRole.STUDENT:
            return queryset.filter(id=user.cohort_id)
        if user.role == UserRole.TEACHER:
            return queryset.filter(teacher_assignments__teacher=user).distinct()
        return queryset

    def get_permissions(self):
        if self.action in {"create", "partial_update", "destroy"}:
            return [IsAdminOrSuperAdmin()]
        if self.action == "grade_settings":
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()

    def destroy(self, request, *args, **kwargs):
        delete_empty_cohort(self.get_object())
        return Response(status=204)

    def _can_manage_grade_settings(self, cohort):
        user = self.request.user
        if user.role in {UserRole.ADMIN, UserRole.SUPER_ADMIN}:
            return True
        return user.role == UserRole.TEACHER and cohort.teacher_assignments.filter(teacher=user).exists()

    @action(detail=True, methods=["get", "patch"], url_path="grade-settings")
    def grade_settings(self, request, pk=None):
        cohort = self.get_object()
        if not self._can_manage_grade_settings(cohort):
            raise PermissionDenied("You can only manage grade settings for assigned cohorts.")
        if request.method == "GET":
            return Response(CohortGradeSettingsSerializer(cohort).data)
        serializer = CohortGradeSettingsSerializer(cohort, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TeacherAssignmentViewSet(ModelViewSet):
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [IsAdminOrSuperAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return TeacherAssignment.objects.none()
        return TeacherAssignment.objects.select_related("teacher", "cohort", "cohort__program")
