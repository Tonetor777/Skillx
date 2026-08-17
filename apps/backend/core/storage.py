from urllib.parse import urljoin

import boto3
from botocore.client import Config
from django.conf import settings
from django.utils.encoding import filepath_to_uri
from django.utils.functional import cached_property
from storages.backends.s3 import S3Storage
from storages.utils import clean_name


def s3_storage_backend_config(bucket_name: str, endpoint_url: str) -> dict[str, str]:
    if bucket_name and endpoint_url:
        return {"BACKEND": "core.storage.PublicEndpointS3Storage"}
    return {"BACKEND": "django.core.files.storage.FileSystemStorage"}


class PublicEndpointS3Storage(S3Storage):
    """Write to the configured S3 endpoint, but sign read URLs for a public host."""

    @cached_property
    def public_endpoint_url(self) -> str:
        return getattr(settings, "AWS_S3_PUBLIC_ENDPOINT_URL", "").rstrip("/")

    @cached_property
    def public_client(self):
        return boto3.client(
            "s3",
            aws_access_key_id=getattr(settings, "AWS_ACCESS_KEY_ID", None),
            aws_secret_access_key=getattr(settings, "AWS_SECRET_ACCESS_KEY", None),
            aws_session_token=getattr(settings, "AWS_SESSION_TOKEN", None),
            endpoint_url=self.public_endpoint_url,
            region_name=getattr(settings, "AWS_S3_REGION_NAME", None),
            config=Config(s3={"addressing_style": getattr(settings, "AWS_S3_ADDRESSING_STYLE", "path")}),
        )

    def url(self, name, parameters=None, expire=None, http_method=None):
        if not self.public_endpoint_url:
            return super().url(name, parameters=parameters, expire=expire, http_method=http_method)

        normalized_name = self._normalize_name(clean_name(name))
        params = {"Bucket": self.bucket_name, "Key": normalized_name}
        if parameters:
            params.update(parameters)

        if self.querystring_auth:
            return self.public_client.generate_presigned_url(
                "get_object",
                Params=params,
                ExpiresIn=expire or self.querystring_expire,
                HttpMethod=http_method,
            )

        return urljoin(
            f"{self.public_endpoint_url}/",
            f"{self.bucket_name}/{filepath_to_uri(normalized_name)}",
        )
