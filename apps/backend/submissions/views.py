from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.choices import UserRole
from accounts.permissions import IsActiveUser, IsTeacherAdminOrSuperAdmin
from submissions.models import Submission
from submissions.serializers import GradeSubmissionSerializer, SubmissionSerializer
from submissions.services import grade_submission


class SubmissionViewSet(ModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Submission.objects.none()
        user = self.request.user
        queryset = Submission.objects.select_related("assignment", "assignment__cohort", "student", "graded_by")
        assignment_id = self.request.query_params.get("assignment_id")
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        if user.role == UserRole.STUDENT:
            return queryset.filter(student=user)
        if user.role == UserRole.TEACHER:
            return queryset.filter(assignment__cohort__teacher_assignments__teacher=user).distinct()
        return queryset

    def get_permissions(self):
        if self.action == "grade":
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], permission_classes=[IsTeacherAdminOrSuperAdmin])
    def grade(self, request, pk=None):
        serializer = GradeSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = grade_submission(
            self.get_object(),
            request.user,
            serializer.validated_data["grade"],
            serializer.validated_data["feedback"],
        )
        return Response(self.get_serializer(submission).data)
