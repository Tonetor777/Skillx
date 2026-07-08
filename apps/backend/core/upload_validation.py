from pathlib import Path

from rest_framework import serializers


IMAGE_UPLOAD_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024


def validate_upload(value, *, allowed_extensions: set[str], file_kind: str):
    if value is None:
        return value

    extension = Path(value.name.lower()).suffix
    if extension not in allowed_extensions:
        raise serializers.ValidationError(f"{file_kind} must be one of: {', '.join(sorted(allowed_extensions))}.")
    if value.size > MAX_UPLOAD_SIZE:
        raise serializers.ValidationError(f"{file_kind} must be 5MB or smaller.")
    return value


def validate_image_upload(value):
    return validate_upload(value, allowed_extensions=IMAGE_UPLOAD_EXTENSIONS, file_kind="Image")
