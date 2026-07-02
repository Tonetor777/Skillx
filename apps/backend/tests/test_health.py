from django.urls import reverse

from skilix import settings as settings_module


def test_health_endpoint(client):
    response = client.get(reverse("health-check"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "skilix-api"}


def test_default_allowed_hosts_support_docker_development_bind_address():
    assert "0.0.0.0" in settings_module.DEFAULT_ALLOWED_HOSTS.split(",")
