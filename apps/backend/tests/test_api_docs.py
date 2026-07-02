import importlib

import pytest
from django.test import override_settings
from django.urls import Resolver404, clear_url_caches, resolve, reverse

import skilix.urls as skilix_urls


def test_openapi_schema_endpoint_is_available_in_debug(client):
    response = client.get(reverse("schema"), HTTP_ACCEPT="application/json")

    assert response.status_code == 200
    schema = response.json()
    assert schema["openapi"].startswith("3.")
    assert schema["info"]["title"] == "Skilix API"
    assert schema["info"]["version"] == "0.1.0"


def test_openapi_schema_includes_jwt_bearer_auth_metadata(client):
    response = client.get(reverse("schema"), HTTP_ACCEPT="application/json")

    assert response.status_code == 200
    security_schemes = response.json()["components"]["securitySchemes"]
    assert security_schemes["BearerAuth"] == {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }


def test_swagger_ui_endpoint_is_available_in_debug(client):
    response = client.get(reverse("swagger-ui"))

    assert response.status_code == 200
    assert b"Swagger" in response.content


@override_settings(DEBUG=False)
def test_api_docs_routes_are_not_registered_when_debug_is_false():
    clear_url_caches()
    production_urls = importlib.reload(skilix_urls)

    try:
        with pytest.raises(Resolver404):
            resolve("/api/schema/", urlconf=production_urls)
        with pytest.raises(Resolver404):
            resolve("/api/docs/", urlconf=production_urls)
    finally:
        importlib.reload(skilix_urls)
        clear_url_caches()
