from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    TokenBlacklistView,
    MeView,
    RegisterView,
    GoogleAuthView,
    OlfactoryProfileView,
)


app_name = "users"

urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),
    path(
        "token/",
        CustomTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "token/blacklist/",
        TokenBlacklistView.as_view(),
        name="token_blacklist",
    ),
    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),
    path(
        "google/",
        GoogleAuthView.as_view(),
        name="google_auth",
    ),
    path(
        "me/olfactory-profile/",
        OlfactoryProfileView.as_view(),
        name="olfactory_profile",
    ),
]