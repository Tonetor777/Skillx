from django.urls import reverse

from core.storage import PublicEndpointS3Storage, s3_storage_backend_config
from skilix import settings as settings_module


def test_health_endpoint(client):
    response = client.get(reverse("health-check"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "skilix-api"}


def test_health_endpoint_supports_head(client):
    response = client.head(reverse("health-check"))

    assert response.status_code == 200
    assert response.content == b""


def test_default_allowed_hosts_support_docker_development_bind_address():
    assert "0.0.0.0" in settings_module.DEFAULT_ALLOWED_HOSTS.split(",")


def test_s3_storage_defaults_are_private_and_minio_compatible():
    assert settings_module.AWS_S3_ADDRESSING_STYLE == "path"
    assert settings_module.AWS_QUERYSTRING_AUTH is True
    assert settings_module.AWS_QUERYSTRING_EXPIRE == 3600
    assert settings_module.AWS_DEFAULT_ACL is None


def test_s3_storage_backend_uses_public_endpoint_storage_when_configured():
    assert s3_storage_backend_config("skilix-media", "http://minio:9000") == {
        "BACKEND": "core.storage.PublicEndpointS3Storage",
    }
    assert s3_storage_backend_config("", "") == {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    }


def test_public_endpoint_s3_storage_signs_urls_for_public_media_host(settings, monkeypatch):
    calls = {}

    class FakeS3Client:
        def generate_presigned_url(self, operation_name, Params, ExpiresIn, HttpMethod):
            calls["operation_name"] = operation_name
            calls["params"] = Params
            calls["expires_in"] = ExpiresIn
            calls["http_method"] = HttpMethod
            return f"{calls['endpoint_url']}/{Params['Bucket']}/{Params['Key']}?signed=1"

    def fake_client(service_name, **kwargs):
        calls["service_name"] = service_name
        calls["endpoint_url"] = kwargs["endpoint_url"]
        return FakeS3Client()

    settings.AWS_S3_PUBLIC_ENDPOINT_URL = "https://media.nexusacademy.info"
    settings.AWS_STORAGE_BUCKET_NAME = "skilix-media"
    settings.AWS_S3_REGION_NAME = "us-east-1"
    settings.AWS_S3_ADDRESSING_STYLE = "path"
    monkeypatch.setattr("core.storage.boto3.client", fake_client)

    storage = PublicEndpointS3Storage()
    storage.bucket_name = "skilix-media"
    storage.querystring_auth = True
    storage.querystring_expire = 3600

    url = storage.url("lessons/images/diagram.png")

    assert url.startswith("https://media.nexusacademy.info/skilix-media/lessons/images/diagram.png")
    assert "http://minio:9000" not in url
    assert calls["service_name"] == "s3"
    assert calls["endpoint_url"] == "https://media.nexusacademy.info"
    assert calls["params"] == {"Bucket": "skilix-media", "Key": "lessons/images/diagram.png"}
    assert calls["expires_in"] == 3600
