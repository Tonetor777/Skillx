from rest_framework.viewsets import ModelViewSet

from accounts.choices import UserRole
from accounts.permissions import IsActiveUser, IsAdminOrSuperAdmin, IsTeacherAdminOrSuperAdmin
from cohorts.models import Cohort, TeacherAssignment
from cohorts.serializers import CohortSerializer, TeacherAssignmentSerializer


class CohortViewSet(ModelViewSet):
    serializer_class = CohortSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Cohort.objects.select_related("program").prefetch_related("students", "teacher_assignments__teacher")
        if user.role == UserRole.STUDENT:
            return queryset.filter(id=user.cohort_id)
        if user.role == UserRole.TEACHER:
            return queryset.filter(teacher_assignments__teacher=user).distinct()
        return queryset

    def get_permissions(self):
        if self.action in {"create", "partial_update"}:
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()


class TeacherAssignmentViewSet(ModelViewSet):
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [IsAdminOrSuperAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return TeacherAssignment.objects.select_related("teacher", "cohort", "cohort__program")
