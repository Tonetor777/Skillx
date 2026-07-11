from django.contrib.auth import get_user_model
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.decorators import parser_classes
from rest_framework.decorators import throttle_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.choices import UserStatus
from accounts.serializers import (
    ActiveTokenObtainPairSerializer,
    CurrentUserSerializer,
    EmailVerificationConfirmSerializer,
    EmailVerificationRequestSerializer,
    LogoutSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)
from accounts.services import send_email_verification, send_password_reset
from accounts.throttles import SensitiveAuthThrottle


class ActiveTokenObtainPairView(TokenObtainPairView):
    serializer_class = ActiveTokenObtainPairSerializer
    throttle_classes = [SensitiveAuthThrottle]


@extend_schema(request=CurrentUserSerializer, responses=CurrentUserSerializer)
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def current_user(request):
    if request.method == "PATCH":
        serializer = CurrentUserSerializer(request.user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(CurrentUserSerializer(request.user, context={"request": request}).data)


@extend_schema(request=LogoutSerializer, responses={204: OpenApiResponse(description="Refresh token blacklisted.")})
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([SensitiveAuthThrottle])
def logout(request):
    serializer = LogoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    token = RefreshToken(serializer.validated_data["refresh"])
    token.blacklist()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(request=EmailVerificationRequestSerializer, responses={200: OpenApiResponse(description="Verification email request accepted.")})
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SensitiveAuthThrottle])
def request_email_verification(request):
    serializer = EmailVerificationRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    User = get_user_model()
    user = User.objects.filter(email=serializer.validated_data["email"]).first()
    if user and user.status == UserStatus.UNVERIFIED:
        send_email_verification(user, request=request)
    return Response({"detail": "If the account needs verification, a verification email has been sent."})


@extend_schema(request=EmailVerificationConfirmSerializer, responses=CurrentUserSerializer)
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SensitiveAuthThrottle])
def confirm_email_verification_view(request):
    serializer = EmailVerificationConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(CurrentUserSerializer(user, context={"request": request}).data)


@extend_schema(request=PasswordResetRequestSerializer, responses={200: OpenApiResponse(description="Password reset request accepted.")})
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SensitiveAuthThrottle])
def request_password_reset(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    User = get_user_model()
    user = User.objects.filter(email=serializer.validated_data["email"]).first()
    if user and user.status != UserStatus.SUSPENDED:
        send_password_reset(user)
    return Response({"detail": "If an account exists, a password reset email has been sent."})


@extend_schema(request=PasswordResetConfirmSerializer, responses={200: OpenApiResponse(description="Password reset completed.")})
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SensitiveAuthThrottle])
def confirm_password_reset_view(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"detail": "Password has been reset."})
