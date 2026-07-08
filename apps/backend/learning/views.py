from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.choices import UserRole
from accounts.permissions import IsActiveUser, IsTeacherAdminOrSuperAdmin
from learning.models import Assignment, Lesson, Module, ModuleStatus, Resource
from learning.serializers import AssignmentSerializer, LessonSerializer, ModuleSerializer, ResourceSerializer


def scope_queryset_to_user(queryset, user, cohort_path="cohort_id"):
    if user.role == UserRole.STUDENT:
        return queryset.filter(**{cohort_path: user.cohort_id})
    if user.role == UserRole.TEACHER:
        teacher_path = cohort_path.replace("_id", "")
        return queryset.filter(**{f"{teacher_path}__teacher_assignments__teacher": user}).distinct()
    return queryset


class AssignmentViewSet(ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Assignment.objects.select_related("cohort", "module", "lesson", "resource").prefetch_related("submissions")
        cohort_id = self.request.query_params.get("cohort_id")
        lesson_id = self.request.query_params.get("lesson_id")
        resource_id = self.request.query_params.get("resource_id")
        if cohort_id:
            queryset = queryset.filter(cohort_id=cohort_id)
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        if resource_id:
            queryset = queryset.filter(resource_id=resource_id)
        if user.role == UserRole.STUDENT:
            return queryset.filter(cohort_id=user.cohort_id, module__status=ModuleStatus.PUBLISHED)
        if user.role == UserRole.TEACHER:
            return queryset.filter(cohort__teacher_assignments__teacher=user).distinct()
        return queryset

    def get_permissions(self):
        if self.action in {"create", "partial_update"}:
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()


class ModuleViewSet(ModelViewSet):
    serializer_class = ModuleSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Module.objects.select_related("cohort", "published_by").prefetch_related("lessons__resources")
        cohort_id = self.request.query_params.get("cohort_id")
        if cohort_id:
            queryset = queryset.filter(cohort_id=cohort_id)
        queryset = scope_queryset_to_user(queryset, user)
        if user.role == UserRole.STUDENT:
            queryset = queryset.filter(status=ModuleStatus.PUBLISHED)
        return queryset

    def get_permissions(self):
        if self.action in {"create", "partial_update", "destroy", "publish"}:
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        module = self.get_object()
        module.status = ModuleStatus.PUBLISHED
        module.publish_date = timezone.now()
        module.published_by = request.user
        module.save(update_fields=["status", "publish_date", "published_by"])
        return Response(self.get_serializer(module).data)


class LessonViewSet(ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Lesson.objects.select_related("module", "module__cohort").prefetch_related("resources")
        module_id = self.request.query_params.get("module_id")
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        if user.role == UserRole.STUDENT:
            return queryset.filter(module__cohort_id=user.cohort_id, module__status=ModuleStatus.PUBLISHED)
        if user.role == UserRole.TEACHER:
            return queryset.filter(module__cohort__teacher_assignments__teacher=user).distinct()
        return queryset

    def get_permissions(self):
        if self.action in {"create", "partial_update", "destroy"}:
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()


class ResourceViewSet(ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        queryset = Resource.objects.select_related("lesson", "lesson__module", "lesson__module__cohort")
        lesson_id = self.request.query_params.get("lesson_id")
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        if user.role == UserRole.STUDENT:
            return queryset.filter(lesson__module__cohort_id=user.cohort_id, lesson__module__status=ModuleStatus.PUBLISHED)
        if user.role == UserRole.TEACHER:
            return queryset.filter(lesson__module__cohort__teacher_assignments__teacher=user).distinct()
        return queryset

    def get_permissions(self):
        if self.action in {"create", "partial_update", "destroy"}:
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()
