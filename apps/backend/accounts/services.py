from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.core.mail import send_mail
from django.urls import reverse
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.exceptions import ValidationError

from accounts.choices import UserStatus


EMAIL_VERIFICATION_SALT = "skilix.email-verification"


def _frontend_url(path: str) -> str:
    base_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return f"{base_url}{path}"


def build_email_verification_token(user) -> str:
    return signing.dumps({"user_id": str(user.id), "email": user.email}, salt=EMAIL_VERIFICATION_SALT)


def send_email_verification(user, request=None) -> None:
    token = build_email_verification_token(user)
    path = reverse("email-verification-confirm")
    api_url = request.build_absolute_uri(path) if request else path
    frontend_url = _frontend_url(f"/verify-email?token={token}")
    send_mail(
        subject="Verify your Skilix email",
        message=(
            "Welcome to Skilix.\n\n"
            f"Verify your email in the app: {frontend_url}\n"
            f"API verification endpoint: {api_url}\n"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def confirm_email_verification(token: str):
    try:
        payload = signing.loads(
            token,
            salt=EMAIL_VERIFICATION_SALT,
            max_age=getattr(settings, "EMAIL_VERIFICATION_TOKEN_MAX_AGE", 60 * 60 * 24),
        )
    except signing.BadSignature as exc:
        raise ValidationError({"token": "Verification token is invalid or expired."}) from exc

    User = get_user_model()
    try:
        user = User.objects.get(id=payload["user_id"], email=payload["email"])
    except User.DoesNotExist as exc:
        raise ValidationError({"token": "Verification token is invalid."}) from exc

    if user.status == UserStatus.UNVERIFIED:
        user.status = UserStatus.ACTIVE
        user.save(update_fields=["status"])
    return user


def send_password_reset(user) -> None:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = _frontend_url(f"/reset-password/confirm?uid={uid}&token={token}")
    send_mail(
        subject="Reset your Skilix password",
        message=f"Use this link to reset your Skilix password: {reset_url}\n",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def confirm_password_reset(uid: str, token: str, password: str):
    User = get_user_model()
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist) as exc:
        raise ValidationError({"token": "Password reset token is invalid."}) from exc

    if not default_token_generator.check_token(user, token):
        raise ValidationError({"token": "Password reset token is invalid or expired."})

    user.set_password(password)
    if user.status == UserStatus.UNVERIFIED:
        user.status = UserStatus.ACTIVE
    user.save(update_fields=["password", "status"])
    return user
