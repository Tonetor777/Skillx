import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.choices import UserRole, UserStatus
from accounts.services import build_email_verification_token


pytestmark = pytest.mark.django_db


def create_user(email, *, status=UserStatus.ACTIVE, password="password"):
    User = get_user_model()
    return User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name="Test",
        last_name="User",
        name="Test User",
        role=UserRole.STUDENT,
        status=status,
    )


def test_logout_blacklists_refresh_token():
    user = create_user("logout@example.com")
    refresh = RefreshToken.for_user(user)
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post("/api/auth/logout/", {"refresh": str(refresh)}, format="json")

    assert response.status_code == 204
    assert client.post("/api/auth/token/refresh/", {"refresh": str(refresh)}, format="json").status_code == 401


def test_email_verification_request_sends_email_for_unverified_user():
    create_user("verify@example.com", status=UserStatus.UNVERIFIED)
    client = APIClient()

    response = client.post("/api/auth/email-verification/request/", {"email": "verify@example.com"}, format="json")

    assert response.status_code == 200
    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert "Verify your Nexus Academy email" in message.subject
    assert "Verify your email:" in message.body
    assert message.alternatives
    assert "Verify email" in message.alternatives[0][0]
    assert message.alternatives[0][1] == "text/html"


def test_email_verification_confirm_activates_unverified_user():
    user = create_user("confirm@example.com", status=UserStatus.UNVERIFIED)
    token = build_email_verification_token(user)
    client = APIClient()

    response = client.post("/api/auth/email-verification/confirm/", {"token": token}, format="json")

    user.refresh_from_db()
    assert response.status_code == 200
    assert user.status == UserStatus.ACTIVE


def test_password_reset_flow_changes_password_and_activates_unverified_user():
    user = create_user("reset@example.com", status=UserStatus.UNVERIFIED, password="old-password")
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    client = APIClient()

    request_response = client.post("/api/auth/password-reset/request/", {"email": user.email}, format="json")
    confirm_response = client.post(
        "/api/auth/password-reset/confirm/",
        {"uid": uid, "token": token, "password": "new-password", "confirm_password": "new-password"},
        format="json",
    )

    user.refresh_from_db()
    assert request_response.status_code == 200
    assert len(mail.outbox) == 1
    assert "Reset your Nexus Academy password" in mail.outbox[0].subject
    assert "Reset your Nexus Academy password:" in mail.outbox[0].body
    assert "Reset password" in mail.outbox[0].alternatives[0][0]
    assert confirm_response.status_code == 200
    assert user.check_password("new-password")
    assert user.status == UserStatus.ACTIVE


def test_password_reset_confirm_rejects_mismatched_password_confirmation():
    user = create_user("mismatch-reset@example.com", password="old-password")
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    client = APIClient()

    response = client.post(
        "/api/auth/password-reset/confirm/",
        {"uid": uid, "token": token, "password": "new-password", "confirm_password": "different-password"},
        format="json",
    )

    user.refresh_from_db()
    assert response.status_code == 400
    assert "confirm_password" in response.data
    assert user.check_password("old-password")
