
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


# ==========================================
# CSRF TOKEN
# ==========================================
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({
        "csrfToken": get_token(request)
    })


# ==========================================
# USER LOGIN
# ==========================================
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response({
            "success": False,
            "message": "Username and password are required."
        }, status=400)

    user = authenticate(
        request,
        username=username,
        password=password
    )

    if user is None:
        return Response({
            "success": False,
            "message": "Invalid username or password."
        }, status=401)

    if not user.is_active:
        return Response({
            "success": False,
            "message": "This account is inactive."
        }, status=403)

    login(request, user)

    return Response({
        "success": True,
        "message": "Login successful!",
        "username": user.username,
    }, status=200)


# ==========================================
# USER REGISTRATION
# ==========================================
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")
    confirm_password = request.data.get(
        "confirm_password", ""
    )

    if not username or not password or not confirm_password:
        return Response({
            "success": False,
            "message": "All fields are required."
        }, status=400)

    if len(password) < 6:
        return Response({
            "success": False,
            "message": "Password must be at least 6 characters."
        }, status=400)

    if password != confirm_password:
        return Response({
            "success": False,
            "message": "Passwords do not match."
        }, status=400)

    if User.objects.filter(username=username).exists():
        return Response({
            "success": False,
            "message": "Username already exists."
        }, status=400)

    user = User.objects.create_user(
        username=username,
        password=password
    )

    login(request, user)

    return Response({
        "success": True,
        "message": "Registration successful!",
        "username": user.username,
    }, status=201)


# ==========================================
# USER LOGOUT
# ==========================================
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def logout_user(request):
    logout(request)

    return Response({
        "success": True,
        "message": "Logout successful!"
    }, status=200)


# ==========================================
# CHECK CURRENT USER
# ==========================================
@api_view(["GET"])
@permission_classes([AllowAny])
def current_user(request):
    if request.user.is_authenticated:
        return Response({
            "success": True,
            "authenticated": True,
            "username": request.user.username,
        }, status=200)

    return Response({
        "success": False,
        "authenticated": False,
        "message": "User is not authenticated."
    }, status=401)
