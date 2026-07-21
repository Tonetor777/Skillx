from drf_spectacular.utils import inline_serializer, extend_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import serializers


@extend_schema(
    responses=inline_serializer(
        name="HealthCheckResponse",
        fields={"status": serializers.CharField(), "service": serializers.CharField()},
    )
)
@api_view(["GET", "HEAD"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "skilix-api"})
