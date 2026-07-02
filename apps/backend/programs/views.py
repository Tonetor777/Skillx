from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsActiveUser, IsTeacherAdminOrSuperAdmin
from programs.models import Program, ProgramStatus
from programs.serializers import ProgramSerializer


class ProgramViewSet(ModelViewSet):
    serializer_class = ProgramSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "head", "options"]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = Program.objects.prefetch_related("cohorts", "cohorts__students")
        if self.request.query_params.get("include_archived") == "true" or self.action in {"retrieve", "archive"}:
            return queryset.all()
        return queryset.exclude(status=ProgramStatus.ARCHIVED)

    def get_permissions(self):
        if self.action in {"create", "partial_update", "archive"}:
            return [IsTeacherAdminOrSuperAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=["patch"])
    def archive(self, request, pk=None):
        program = self.get_object()
        program.status = ProgramStatus.ARCHIVED
        program.save(update_fields=["status"])
        return Response(self.get_serializer(program).data)
