from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    ActiveTokenObtainPairView,
    confirm_email_verification_view,
    confirm_password_reset_view,
    logout,
    request_email_verification,
    request_password_reset,
)
from core.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/token/", ActiveTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/logout/", logout, name="auth-logout"),
    path("api/auth/email-verification/request/", request_email_verification, name="auth-email-verification-request"),
    path("api/auth/email-verification/confirm/", confirm_email_verification_view, name="auth-email-verification-confirm"),
    path("api/auth/password-reset/request/", request_password_reset, name="auth-password-reset-request"),
    path("api/auth/password-reset/confirm/", confirm_password_reset_view, name="auth-password-reset-confirm"),
    path("api/accounts/", include("accounts.urls")),
    path("api/programs/", include("programs.urls")),
    path("api/cohorts/", include("cohorts.urls")),
    path("api/teacher-assignments/", include("cohorts.teacher_assignment_urls")),
    path("api/applications/", include("applications.urls")),
    path("api/invitations/", include("applications.invitation_urls")),
    path("api/", include("learning.urls")),
    path("api/submissions/", include("submissions.urls")),
    path("api/announcements/", include("announcements.urls")),
    path("api/", include("dashboard.urls")),
]

if settings.DEBUG:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
