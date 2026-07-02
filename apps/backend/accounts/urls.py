from django.urls import path

from accounts.views import (
    confirm_email_verification_view,
    confirm_password_reset_view,
    current_user,
    logout,
    request_email_verification,
    request_password_reset,
)

urlpatterns = [
    path("me/", current_user, name="current-user"),
    path("logout/", logout, name="logout"),
    path("email-verification/request/", request_email_verification, name="email-verification-request"),
    path("email-verification/confirm/", confirm_email_verification_view, name="email-verification-confirm"),
    path("password-reset/request/", request_password_reset, name="password-reset-request"),
    path("password-reset/confirm/", confirm_password_reset_view, name="password-reset-confirm"),
]
