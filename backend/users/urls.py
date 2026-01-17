from django.urls import path

from .views import BecomeCreatorView, GitHubLoginView, GoogleLoginView, MeView, RegisterView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("google-login/", GoogleLoginView.as_view(), name="google_login"),
    path("github-login/", GitHubLoginView.as_view(), name="github_login"),
    path("become-creator/", BecomeCreatorView.as_view(), name="become_creator"),
]
