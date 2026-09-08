from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.views import TokenBlacklistView as SimpleJWTTokenBlacklistView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomUser
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    MeSerializer,
    OlfactoryProfileSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [
        permissions.AllowAny,
    ]


class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [
        permissions.AllowAny,
    ]
    serializer_class = CustomTokenObtainPairSerializer


class TokenBlacklistView(SimpleJWTTokenBlacklistView):
    """
    Invalida o `refresh_token` no servidor e responde `205 No Content`
    (contrato RF-07.5).
    """

    _serializer_class = api_settings.TOKEN_BLACKLIST_SERIALIZER
    permission_classes = [
        permissions.AllowAny,
    ]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0]) from e

        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_object(self):
        return self.request.user


class GoogleAuthView(APIView):
    permission_classes = [
        permissions.AllowAny,
    ]

    def post(self, request):
        token = request.data.get("id_token")
        if not token:
            return Response(
                {"detail": "id_token é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Validação do token diretamente nos servidores do Google
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                getattr(settings, 'GOOGLE_OAUTH2_CLIENT_ID', None)
            )
            
            email = idinfo.get("email")
            if not email:
                return Response(
                    {"detail": "Token não contém e-mail."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Busca ou cria o usuário B2C (Customer)
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                user = CustomUser.objects.create_user(
                    email=email,
                    first_name=idinfo.get("given_name", ""),
                    last_name=idinfo.get("family_name", ""),
                    role=CustomUser.Roles.CUSTOMER
                )

            # Reutiliza o Serializer do CustomToken para obter Access e Refresh
            refresh = CustomTokenObtainPairSerializer.get_token(user)

            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_200_OK
            )
            
        except ValueError:
            return Response(
                {"detail": "Token do Google inválido."}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class OlfactoryProfileView(generics.UpdateAPIView):
    serializer_class = OlfactoryProfileSerializer
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_object(self):
        return self.request.user