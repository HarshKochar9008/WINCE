from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "name", "avatar", "role")
        read_only_fields = ("id", "email", "role")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=True,
        style={"input_type": "password"},
        help_text="Password must be at least 8 characters long",
    )
    email = serializers.EmailField(required=True)
    name = serializers.CharField(required=True, max_length=150, allow_blank=False)

    class Meta:
        model = User
        fields = ("id", "email", "name", "avatar", "role", "password")
        read_only_fields = ("id", "role")

    def validate_email(self, value):
        """Validate email format and check for uniqueness."""
        if not value:
            raise serializers.ValidationError("Email is required.")
        value = value.lower().strip()
        if not value:
            raise serializers.ValidationError("Email cannot be empty.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        """Validate password strength."""
        if not value:
            raise serializers.ValidationError("Password is required.")
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        # Check for at least one letter and one number
        has_letter = any(c.isalpha() for c in value)
        has_digit = any(c.isdigit() for c in value)
        if not (has_letter and has_digit):
            raise serializers.ValidationError(
                "Password must contain at least one letter and one number."
            )
        return value

    def validate_name(self, value):
        """Validate name field."""
        if not value:
            raise serializers.ValidationError("Name is required.")
        if not isinstance(value, str):
            raise serializers.ValidationError("Name must be a string.")
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name cannot be empty.")
        if len(value) > 150:
            raise serializers.ValidationError("Name must be 150 characters or less.")
        return value

    def validate(self, attrs):
        """Additional validation for the entire serializer."""
        # Ensure role is not provided in request (it's read-only)
        if "role" in attrs:
            attrs.pop("role")
        return attrs

    def create(self, validated_data):
        """Create a new user with hashed password."""
        password = validated_data.pop("password")
        # Ensure role defaults to USER if not provided
        validated_data.setdefault("role", User.Role.USER)
        user = User.objects.create_user(password=password, **validated_data)
        return user


class GoogleAuthCodeSerializer(serializers.Serializer):
    code = serializers.CharField()
    redirect_uri = serializers.CharField(required=False, allow_blank=True)
    code_verifier = serializers.CharField(required=False, allow_blank=True)


class GoogleIdTokenSerializer(serializers.Serializer):
    credential = serializers.CharField()


class GitHubAccessTokenSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=False)


class GitHubCodeSerializer(serializers.Serializer):
    code = serializers.CharField()