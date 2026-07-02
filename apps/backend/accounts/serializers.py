from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.choices import UserStatus
from accounts.models import User
from accounts.services import confirm_email_verification, confirm_password_reset
from core.upload_validation import validate_image_upload


class CurrentUserSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    cohort_id = serializers.SerializerMethodField()
    photo = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "status",
            "avatar_url",
            "photo",
            "bio",
            "cohort_id",
            "created_at",
        ]
        read_only_fields = ["id", "email", "role", "status", "avatar_url", "cohort_id", "created_at"]

    def get_id(self, obj):
        return str(obj.id)

    def get_role(self, obj):
        return obj.role.lower()

    def get_status(self, obj):
        return obj.status.lower()

    def get_avatar_url(self, obj):
        if not obj.photo:
            return ""
        request = self.context.get("request")
        url = obj.photo.url
        return request.build_absolute_uri(url) if request else url

    def get_cohort_id(self, obj):
        return str(obj.cohort_id) if obj.cohort_id else None

    def validate_photo(self, value):
        return validate_image_upload(value)

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.bio = validated_data.get("bio", instance.bio)
        if "photo" in validated_data:
            instance.photo = validated_data["photo"]
        instance.name = f"{instance.first_name} {instance.last_name}".strip()
        instance.save(update_fields=["first_name", "last_name", "bio", "photo", "name"])
        return instance


class ActiveTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.status != UserStatus.ACTIVE:
            raise serializers.ValidationError({"detail": "Only active users can log in."})
        data["user"] = CurrentUserSerializer(self.user, context=self.context).data
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class EmailVerificationRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class EmailVerificationConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()

    def save(self, **kwargs):
        return confirm_email_verification(self.validated_data["token"])


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(min_length=8, write_only=True)

    def save(self, **kwargs):
        return confirm_password_reset(
            self.validated_data["uid"],
            self.validated_data["token"],
            self.validated_data["password"],
        )
