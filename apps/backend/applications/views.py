from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsActiveUser, IsAdminOrSuperAdmin, IsSuperAdmin
from accounts.serializers import CurrentUserSerializer
from applications.models import Application, Invitation
from applications.serializers import ApplicationSerializer, InvitationAcceptSerializer, InvitationSerializer
from applications.services import approve_application, reject_application, resend_invitation, revoke_invitation


class ApplicationViewSet(ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "head", "options"]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return Application.objects.select_related("program", "reviewed_by").all()

    def get_permissions(self):
        if self.action in {"list", "retrieve", "approve", "reject"}:
            return [IsSuperAdmin()]
        if self.action == "create":
            return [AllowAny()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], permission_classes=[IsSuperAdmin])
    def approve(self, request, pk=None):
        application = approve_application(self.get_object(), request.user)
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=["post"], permission_classes=[IsSuperAdmin])
    def reject(self, request, pk=None):
        application = reject_application(self.get_object(), request.user)
        return Response(self.get_serializer(application).data)


class InvitationViewSet(ModelViewSet):
    serializer_class = InvitationSerializer
    permission_classes = [IsAdminOrSuperAdmin]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return Invitation.objects.select_related("cohort", "cohort__program").all()

    @action(detail=False, methods=["post"], permission_classes=[AllowAny], url_path=r"(?P<token>[^/.]+)/accept")
    def accept(self, request, token=None):
        serializer = InvitationAcceptSerializer(data={**request.data, "token": token}, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(CurrentUserSerializer(user, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def resend(self, request, pk=None):
        invitation = resend_invitation(self.get_object())
        return Response(self.get_serializer(invitation).data)

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        invitation = revoke_invitation(self.get_object())
        return Response(self.get_serializer(invitation).data)
