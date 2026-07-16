import importlib
import os
import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

from django.core.mail import EmailMessage
from django.test import override_settings


def test_production_settings_reject_weak_secret_key():
    env = {
        **os.environ,
        "DJANGO_DEBUG": "false",
        "DJANGO_SECRET_KEY": "weak",
    }

    result = subprocess.run(
        [sys.executable, "-c", "import skilix.settings"],
        cwd=Path(__file__).resolve().parents[1],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "DJANGO_SECRET_KEY must be a strong unique value" in result.stderr


def test_production_settings_default_to_https_protections(monkeypatch):
    monkeypatch.setenv("DJANGO_DEBUG", "false")
    monkeypatch.setenv("DJANGO_SECRET_KEY", "production-secret-key-with-more-than-fifty-unique-safe-chars-123")
    monkeypatch.setenv("DJANGO_ALLOWED_HOSTS", "api.skilix.example")
    monkeypatch.setenv("DJANGO_CSRF_TRUSTED_ORIGINS", "https://skilix.example")
    monkeypatch.setenv("DJANGO_CORS_ALLOWED_ORIGINS", "https://skilix.example")

    import skilix.settings as settings_module

    reloaded = importlib.reload(settings_module)

    assert reloaded.DEBUG is False
    assert reloaded.SECURE_SSL_REDIRECT is True
    assert reloaded.SESSION_COOKIE_SECURE is True
    assert reloaded.CSRF_COOKIE_SECURE is True
    assert reloaded.SECURE_HSTS_SECONDS == 31536000
    assert reloaded.CORS_ALLOWED_ORIGINS == ["https://skilix.example"]

    monkeypatch.setenv("DJANGO_DEBUG", "true")
    importlib.reload(settings_module)


def test_backend_serves_collected_static_files_with_whitenoise():
    from django.conf import settings

    assert "whitenoise.middleware.WhiteNoiseMiddleware" in settings.MIDDLEWARE
    assert (
        settings.STORAGES["staticfiles"]["BACKEND"]
        == "whitenoise.storage.CompressedManifestStaticFilesStorage"
    )


def test_gmail_smtp_environment_configures_email_backend(monkeypatch):
    monkeypatch.delenv("DJANGO_EMAIL_BACKEND", raising=False)
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    monkeypatch.setenv("EMAIL_HOST", "smtp.gmail.com")
    monkeypatch.setenv("EMAIL_PORT", "587")
    monkeypatch.setenv("EMAIL_USE_TLS", "true")
    monkeypatch.setenv("EMAIL_HOST_USER", "demtse.yibabe@gmail.com")
    monkeypatch.setenv("EMAIL_HOST_PASSWORD", "app-password-placeholder")
    monkeypatch.setenv("DEFAULT_FROM_EMAIL", "demtse.yibabe@gmail.com")

    import skilix.settings as settings_module

    reloaded = importlib.reload(settings_module)

    assert reloaded.EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
    assert reloaded.EMAIL_HOST == "smtp.gmail.com"
    assert reloaded.EMAIL_PORT == 587
    assert reloaded.EMAIL_USE_TLS is True
    assert reloaded.EMAIL_HOST_USER == "demtse.yibabe@gmail.com"
    assert reloaded.DEFAULT_FROM_EMAIL == "demtse.yibabe@gmail.com"

    monkeypatch.delenv("EMAIL_HOST_PASSWORD", raising=False)
    importlib.reload(settings_module)


@override_settings(
    RESEND_API_KEY="test-resend-key",
    DEFAULT_FROM_EMAIL="no-reply@example.com",
)
def test_resend_email_backend_posts_expected_payload():
    from core.email import ResendEmailBackend

    class FakeResponse:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

    message = EmailMessage(
        subject="Welcome",
        body="Hello from Skilix",
        from_email="no-reply@example.com",
        to=["student@example.com"],
    )

    with patch("core.email.request.urlopen", return_value=FakeResponse()) as urlopen:
        sent_count = ResendEmailBackend().send_messages([message])

    assert sent_count == 1
    req = urlopen.call_args.args[0]
    assert req.headers["Authorization"] == "Bearer test-resend-key"
    assert b'"to": ["student@example.com"]' in req.data
