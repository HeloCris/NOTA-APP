from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.permissions import IsPlatformAdmin, IsBrandOwner
from apps.stores.models import Store
from apps.users.models import CustomUser

from .models import Brand, Product
from .serializers import (
    BrandSerializer,
    ProductSerializer,
    BrandOnboardingSerializer,
    BrandProductSerializer
)


class BrandListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = BrandSerializer

    def get_queryset(self):
        queryset = Brand.objects.all()
        is_official = self.request.query_params.get("is_official")
        if is_official is not None:
            queryset = queryset.filter(is_official=is_official.lower() == "true")
        return queryset


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Product.objects.filter(is_approved=True).select_related("brand")
        params = self.request.query_params

        if search := params.get("search"):
            queryset = queryset.filter(name__icontains=search)
        if brand := params.get("brand"):
            queryset = queryset.filter(brand_id=brand)
        if family := params.get("olfactory_family"):
            queryset = queryset.filter(olfactory_family__iexact=family)
        for field in ("top_notes", "heart_notes", "base_notes"):
            if note := params.get(field):
                queryset = queryset.filter(**{f"{field}__icontains": note})

        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer
    queryset = Product.objects.filter(is_approved=True).select_related("brand")






class BrandStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        cnpj = request.query_params.get("cnpj")
        inpi = request.query_params.get("inpi")

        if not cnpj or not inpi:
            return Response({"detail": "CNPJ e INPI são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)


        cnpj_raw = "".join(filter(str.isdigit, cnpj))

        brand = Brand.objects.filter(cnpj=cnpj_raw, inpi_registration=inpi).first()
        if not brand:
            return Response({"detail": "Não encontramos nenhuma solicitação com os dados informados."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "name": brand.name,
            "status": brand.status
        })

class BrandRegisterView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BrandOnboardingSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user, status=Brand.BrandStatus.PENDING)

from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError, ObjectDoesNotExist

class BrandOnboardingView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data


        first_name = data.get("first_name")
        last_name = data.get("last_name")
        email = data.get("email")
        password = data.get("password")
        phone = data.get("phone")


        brand_name = data.get("brand_name")
        cnpj = data.get("cnpj")
        inpi = data.get("inpi_registration")


        social_contract = request.FILES.get("social_contract")
        inpi_certificate = request.FILES.get("inpi_certificate")

        if not all([first_name, email, password, brand_name, cnpj]):
            return Response({"detail": "Preencha todos os campos obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(email=email).exists():
            return Response({"detail": "E-mail já cadastrado."}, status=status.HTTP_400_BAD_REQUEST)

        if Brand.objects.filter(cnpj=cnpj).exists():
            return Response({"detail": "CNPJ já cadastrado."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():

                user = CustomUser(
                    email=email,
                    first_name=first_name,
                    last_name=last_name or "",
                    phone=phone or "",
                    role=CustomUser.Roles.CUSTOMER,
                    is_active=False
                )
                user.set_password(password)
                user.save()


                brand = Brand(
                    name=brand_name,
                    cnpj=cnpj,
                    inpi_registration=inpi,
                    owner=user,
                    status=Brand.BrandStatus.PENDING,
                )
                if social_contract:
                    brand.social_contract = social_contract
                if inpi_certificate:
                    brand.inpi_certificate = inpi_certificate
                brand.save()

                return Response({"detail": "Cadastro recebido com sucesso. Aguardando aprovação."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminBrandApproveView(APIView):
    permission_classes = [IsPlatformAdmin]

    def patch(self, request, pk, *args, **kwargs):
        try:
            brand = Brand.objects.get(pk=pk)
        except ObjectDoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        if new_status not in [Brand.BrandStatus.APPROVED, Brand.BrandStatus.REJECTED]:
            return Response({"detail": "Status inválido."}, status=status.HTTP_400_BAD_REQUEST)

        brand.status = new_status
        if new_status == Brand.BrandStatus.APPROVED:
            brand.is_official = True


            if brand.owner:
                brand.owner.role = CustomUser.Roles.BRAND_OWNER
                brand.owner.is_active = True
                brand.owner.save()

        brand.save()
        return Response(BrandSerializer(brand).data)


class BrandMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsBrandOwner]
    serializer_class = BrandSerializer

    def get_object(self):
        return self.request.user.brands.first()


class BrandProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsBrandOwner]
    serializer_class = BrandProductSerializer

    def get_queryset(self):
        brand = self.request.user.brands.first()
        if not brand:
            return Product.objects.none()
        return Product.objects.filter(brand=brand)

    def perform_create(self, serializer):
        brand = self.request.user.brands.first()
        serializer.save(brand=brand, is_approved=True)

    def perform_destroy(self, instance):
        instance.is_approved = False
        instance.save()


class ActivateD2CView(APIView):
    permission_classes = [IsBrandOwner]

    def post(self, request, *args, **kwargs):
        brand = request.user.brands.first()
        if not brand:
            return Response({"detail": "Marca não encontrada."}, status=status.HTTP_404_NOT_FOUND)

        if brand.d2c_store:
            return Response({"detail": "D2C já ativo."}, status=status.HTTP_400_BAD_REQUEST)


        if Store.objects.filter(cnpj=brand.cnpj).exists():
             return Response({"detail": "Já existe uma loja com este CNPJ."}, status=status.HTTP_400_BAD_REQUEST)

        store = Store.objects.create(
            owner=request.user,
            name=brand.name,
            cnpj=brand.cnpj,
            is_official=True,
            is_active=True
        )

        brand.d2c_store = store
        brand.save()

        refresh = RefreshToken.for_user(request.user)
        return Response({
            "detail": "Loja D2C ativada com sucesso.",
            "store_id": store.id,
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }, status=status.HTTP_201_CREATED)


class DeactivateD2CView(APIView):
    permission_classes = [IsBrandOwner]

    def post(self, request, *args, **kwargs):
        brand = request.user.brands.first()
        if not brand or not brand.d2c_store:
            return Response({"detail": "D2C não está ativo."}, status=status.HTTP_400_BAD_REQUEST)

        store = brand.d2c_store
        store.is_active = False
        store.save()

        return Response({"detail": "Loja D2C desativada."})