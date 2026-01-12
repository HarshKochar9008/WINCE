from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import generics, permissions, status, throttling
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import requests

from .serializers import GitHubAccessTokenSerializer, GitHubCodeSerializer, GoogleIdTokenSerializer, RegisterSerializer, UserSerializer

User = get_user_model()


class LoginThrottle(throttling.AnonRateThrottle):
    rate = "5/minute"


class RegisterThrottle(throttling.AnonRateThrottle):
    rate = "10/hour"


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
    Creates a new user account with email, name, and password.
    Returns user data and JWT tokens upon successful registration.
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterThrottle]

    def create(self, request, *args, **kwargs):
        """Override create to return JWT tokens after registration."""
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            # Return detailed validation errors
            return Response(
                {
                    "detail": "Validation failed",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            user = serializer.save()

            # Generate JWT tokens for the newly registered user
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            return Response(
                {
                    "user": UserSerializer(user).data,
                    "access": str(access),
                    "refresh": str(refresh),
                    "message": "User registered successfully",
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            # Handle any unexpected errors during user creation
            return Response(
                {
                    "detail": f"Error creating user: {str(e)}",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class GoogleLoginView(generics.GenericAPIView):
    """
    Frontend obtains a Google ID token ("credential") via Google Identity Services,
    then exchanges it here for our app's JWT (SimpleJWT).
    """

    serializer_class = GoogleIdTokenSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request, *args, **kwargs):
        if not getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", ""):
            return Response(
                {
                    "detail": "Google OAuth client ID is not configured on the server. Set GOOGLE_OAUTH_CLIENT_ID.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data["credential"]

        try:
            payload = google_id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                audience=settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except Exception:
            return Response({"detail": "Invalid Google credential."}, status=status.HTTP_400_BAD_REQUEST)

        email = payload.get("email")
        if not email:
            return Response({"detail": "Google account email missing."}, status=status.HTTP_400_BAD_REQUEST)

        name = payload.get("name") or email.split("@", 1)[0]
        avatar = payload.get("picture") or ""

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"name": name, "avatar": avatar},
        )

        # Keep profile info reasonably fresh (don't clobber custom name/avatar if already set).
        changed = False
        if created:
            changed = True
        else:
            if avatar and not user.avatar:
                user.avatar = avatar
                changed = True
            if name and not user.name:
                user.name = name
                changed = True

        if changed:
            user.save(update_fields=["name", "avatar"])

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        return Response(
            {
                "access": str(access),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class GitHubLoginView(generics.GenericAPIView):
    """
    Frontend obtains a GitHub authorization code via GitHub OAuth redirect,
    then exchanges it here for our app's JWT (SimpleJWT).
    Supports both authorization code and access token flows.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request, *args, **kwargs):
        # Check if we have a code (OAuth flow) or access_token (direct token)
        code = request.data.get("code")
        access_token = request.data.get("access_token")

        if code:
            # Exchange authorization code for access token
            serializer = GitHubCodeSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            access_token = self._exchange_code_for_token(code)
        elif access_token:
            # Use provided access token directly
            serializer = GitHubAccessTokenSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
        else:
            return Response(
                {"detail": "Either 'code' or 'access_token' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not access_token:
            return Response(
                {"detail": "Failed to obtain GitHub access token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Verify token and get user info from GitHub API
            headers = {"Authorization": f"token {access_token}"}
            user_response = requests.get("https://api.github.com/user", headers=headers, timeout=10)
            user_response.raise_for_status()
            github_user = user_response.json()

            # Get email (may need to fetch from email endpoint if not in user response)
            email = github_user.get("email")
            if not email:
                # Try to get email from GitHub email endpoint
                email_response = requests.get("https://api.github.com/user/emails", headers=headers, timeout=10)
                if email_response.status_code == 200:
                    emails = email_response.json()
                    primary_email = next((e for e in emails if e.get("primary")), None)
                    if primary_email:
                        email = primary_email.get("email")
                    elif emails:
                        email = emails[0].get("email")

            if not email:
                return Response(
                    {"detail": "GitHub account email not available. Please ensure your GitHub account has a public email."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            name = github_user.get("name") or github_user.get("login") or email.split("@", 1)[0]
            avatar = github_user.get("avatar_url") or ""

            user, created = User.objects.get_or_create(
                email=email,
                defaults={"name": name, "avatar": avatar},
            )

            # Keep profile info reasonably fresh (don't clobber custom name/avatar if already set).
            changed = False
            if created:
                changed = True
            else:
                if avatar and not user.avatar:
                    user.avatar = avatar
                    changed = True
                if name and not user.name:
                    user.name = name
                    changed = True

            if changed:
                user.save(update_fields=["name", "avatar"])

            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            return Response(
                {
                    "access": str(access),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )
        except requests.RequestException as e:
            return Response(
                {"detail": f"Failed to verify GitHub token: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"detail": f"GitHub authentication failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _exchange_code_for_token(self, code: str) -> str | None:
        """Exchange GitHub authorization code for access token."""
        if not getattr(settings, "GITHUB_OAUTH_CLIENT_ID", "") or not getattr(settings, "GITHUB_OAUTH_CLIENT_SECRET", ""):
            return None

        token_url = "https://github.com/login/oauth/access_token"
        data = {
            "client_id": settings.GITHUB_OAUTH_CLIENT_ID,
            "client_secret": settings.GITHUB_OAUTH_CLIENT_SECRET,
            "code": code,
        }
        headers = {"Accept": "application/json"}

        try:
            response = requests.post(token_url, data=data, headers=headers, timeout=10)
            response.raise_for_status()
            token_data = response.json()
            return token_data.get("access_token")
        except requests.RequestException:
            return None
