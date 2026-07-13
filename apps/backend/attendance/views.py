from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.choices import UserRole
from accounts.permissions import IsActiveUser, IsTeacherAdminOrSuperAdmin
from attendance.models import AttendanceRecord, AttendanceSession
from attendance.serializers import (
    AttendanceBulkRecordsSerializer,
    AttendanceSessionSerializer,
    can_access_cohort,
    can_manage_cohort,
)


class AttendanceSessionViewSet(ModelViewSet):
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return AttendanceSession.objects.none()
        user = self.request.user
        queryset = AttendanceSession.objects.select_related("cohort", "recorded_by").prefetch_related("records__student")
        cohort_id = self.request.query_params.get("cohort_id")
        if cohort_id:
            queryset = queryset.filter(cohort_id=cohort_id)
        if user.role == UserRole.STUDENT:
            return queryset.filter(cohort_id=user.cohort_id, records__student=user).distinct()
        if user.role == UserRole.TEACHER:
            return queryset.filter(cohort__teacher_assignments__teacher=user).distinct()
        return queryset

    def get_permissions(self):
        if self.action in {"create", "partial_update", "records"}:
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()

    def perform_update(self, serializer):
        session = self.get_object()
        if not can_manage_cohort(self.request.user, session.cohort):
            raise PermissionDenied("You can only manage attendance for assigned cohorts.")
        serializer.save(recorded_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsTeacherAdminOrSuperAdmin])
    def records(self, request, pk=None):
        session = self.get_object()
        if not can_manage_cohort(request.user, session.cohort):
            raise PermissionDenied("You can only manage attendance for assigned cohorts.")
        serializer = AttendanceBulkRecordsSerializer(data=request.data, context={"session": session})
        serializer.is_valid(raise_exception=True)
        if not serializer.validated_data["records"]:
            raise ValidationError({"records": "At least one attendance record is required."})
        for record in serializer.validated_data["records"]:
            AttendanceRecord.objects.update_or_create(
                session=session,
                student_id=record["student_id"],
                defaults={
                    "status": record["status"].upper(),
                    "note": record.get("note", ""),
                    "recorded_by": request.user,
                },
            )
        refreshed = self.get_queryset().get(id=session.id)
        return Response(self.get_serializer(refreshed).data)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["can_access_cohort"] = can_access_cohort
        return context
