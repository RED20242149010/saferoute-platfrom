
from django.urls import path

from .views import (
    csrf_token,
    login_user,
    register_user,
    logout_user,
    current_user,
)

urlpatterns = [
    path("csrf/", csrf_token, name="csrf"),
    path("login/", login_user, name="login"),
    path("register/", register_user, name="register"),
    path("logout/", logout_user, name="logout"),
    path("me/", current_user, name="current_user"),
]