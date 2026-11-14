from decimal import Decimal, InvalidOperation

from django.core.exceptions import ObjectDoesNotExist
from django.db import models, transaction

from rest_framework import generics, permissions, status, viewsets
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.permissions import IsBrandOwner, IsPlatformAdmin
from apps.stores.models import Store, StoreFollower
from apps.users.models import CustomUser

from .models import Brand, Product
from .serializers import (
    BrandOnboardingSerializer,
    BrandProductSerializer,
    BrandSerializer,
    ProductSerializer,
)
from .services.recommendation_service import calculate_olfactory_match


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
        user = self.request.user if hasattr(self.request, "user") else None

        # Se o usuário autenticado for BRAND_OWNER, restringe a busca aos perfumes da sua marca
        if user and user.is_authenticated and getattr(user, "role", None) == "BRAND_OWNER":
            brand = user.brands.first()
            if brand:
                queryset = queryset.filter(brand=brand)

        params = self.request.query_params

        search = params.get("search") or params.get("q")
        if search:
            search_filter = (
                models.Q(name__icontains=search)
                | models.Q(brand__name__icontains=search)
                | models.Q(olfactory_family__icontains=search)
                | models.Q(top_notes__icontains=search)
                | models.Q(heart_notes__icontains=search)
                | models.Q(base_notes__icontains=search)
            )
            queryset = queryset.filter(search_filter)
        if brand := params.get("brand"):
            queryset = queryset.filter(brand_id=brand)
        family = params.get("olfactory_family") or params.get("family")
        if family:
            queryset = queryset.filter(olfactory_family__iexact=family)
        if concentration := params.get("concentration"):
            queryset = queryset.filter(concentration__iexact=concentration)
        if gender := params.get("gender"):
            queryset = queryset.filter(gender__iexact=gender)
        notes = [note.strip() for note in params.get("notes", "").split(",") if note.strip()]
        if notes:
            notes_filter = models.Q()
            for note in notes:
                notes_filter |= (
                    models.Q(top_notes__icontains=note)
                    | models.Q(heart_notes__icontains=note)
                    | models.Q(base_notes__icontains=note)
                )
            queryset = queryset.filter(notes_filter)

        for field in ("top_notes", "heart_notes", "base_notes"):
            if note := params.get(field):
                queryset = queryset.filter(**{f"{field}__icontains": note})

        active_offer = models.Q(
            store_products__is_available=True,
            store_products__stock_quantity__gt=0,
            store_products__store__is_active=True,
        )
        if params.get("available_only", "").lower() == "true":
            queryset = queryset.filter(active_offer)

        product_type = params.get("type") or params.get("format")
        if product_type == "decant":
            queryset = queryset.filter(active_offer, store_products__volume_ml__lte=15)
        elif product_type == "bottle":
            queryset = queryset.filter(active_offer, store_products__volume_ml__gt=15)

        try:
            min_price = Decimal(params["min_price"]) if params.get("min_price") else None
        except (InvalidOperation, TypeError, ValueError):
            min_price = None
        try:
            max_price = Decimal(params["max_price"]) if params.get("max_price") else None
        except (InvalidOperation, TypeError, ValueError):
            max_price = None
        if min_price is not None:
            queryset = queryset.filter(active_offer, store_products__price__gte=min_price)
        if max_price is not None:
            queryset = queryset.filter(active_offer, store_products__price__lte=max_price)

        queryset = queryset.distinct()
        ordering = params.get("ordering", "popular")
        if ordering == "price_asc":
            queryset = queryset.annotate(
                search_min_price=models.Min("store_products__price", filter=active_offer)
            ).order_by("search_min_price", "name")
        elif ordering == "price_desc":
            queryset = queryset.annotate(
                search_min_price=models.Min("store_products__price", filter=active_offer)
            ).order_by("-search_min_price", "name")
        else:
            if notes:
                note_match_cases = [
                    models.When(
                        models.Q(top_notes__icontains=note)
                        | models.Q(heart_notes__icontains=note)
                        | models.Q(base_notes__icontains=note),
                        then=models.Value(1),
                    )
                    for note in notes
                ]
                queryset = queryset.annotate(
                    note_match_count=models.Sum(
                        models.Case(
                            *note_match_cases,
                            default=models.Value(0),
                            output_field=models.IntegerField(),
                        )
                    )
                ).order_by("-note_match_count", "-sold_count", "name")
            else:
                queryset = queryset.order_by("-sold_count", "name")

        return queryset

    def list(self, request, *args, **kwargs):
        user = request.user
        requested_ordering = request.query_params.get("ordering", "popular")
        user_families = getattr(user, "olfactory_families", []) or []
        user_notes = getattr(user, "preferred_notes", []) or []

        if (
            requested_ordering == "popular"
            and not request.query_params.get("notes")
            and user.is_authenticated
            and (user_families or user_notes)
        ):
            products = list(self.get_queryset())
            followed_store_ids = set(
                StoreFollower.objects.filter(user=user).values_list("store_id", flat=True)
            )
            for product in products:
                match_data = calculate_olfactory_match(user, product, followed_store_ids)
                product._calculated_match = match_data["match_percentage"] or 0

            products.sort(
                key=lambda product: (
                    product._calculated_match,
                    getattr(product, "sold_count", 0),
                ),
                reverse=True,
            )
            page = self.paginate_queryset(products)
            if page is not None:
                products = page
            serializer = self.get_serializer(
                products,
                many=True,
                context={"request": request, "followed_store_ids": followed_store_ids},
            )
            if page is not None:
                return self.get_paginated_response(serializer.data)
            return Response(serializer.data)

        return super().list(request, *args, **kwargs)


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
        return self.request.user.brands.first()  # type: ignore[union-attr]


class BrandProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsBrandOwner]
    serializer_class = BrandProductSerializer

    def get_queryset(self):
        brand = self.request.user.brands.first()  # type: ignore[union-attr]
        if not brand:
            return Product.objects.none()
        return Product.objects.filter(brand=brand)

    def perform_create(self, serializer):
        brand = self.request.user.brands.first()  # type: ignore[union-attr]
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


class CatalogNotesView(APIView):
    """
    GET /api/v1/catalog/notes/
    Retorna a agregação ordenada e sem duplicatas das notas olfativas presentes nos perfumes aprovados.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        products = Product.objects.filter(is_approved=True)

        top_notes_set, heart_notes_set, base_notes_set, families_set = set(), set(), set(), set()

        for p in products:
            if p.olfactory_family:
                families_set.add(p.olfactory_family)
            if p.top_notes:
                top_notes_set.update(p.top_notes)
            if p.heart_notes:
                heart_notes_set.update(p.heart_notes)
            if p.base_notes:
                base_notes_set.update(p.base_notes)

        return Response({
            "top_notes": sorted(list(top_notes_set)),
            "heart_notes": sorted(list(heart_notes_set)),
            "base_notes": sorted(list(base_notes_set)),
            "families": sorted(list(families_set)),
        })


class RecommendedProductListView(ListAPIView):
    """
    GET /api/v1/products/recommended/?exclude_id=<id>&limit=<n>
    Retorna perfumes aprovados com oferta em estoque, ordenados por match olfativo ou sold_count.
    """
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.filter(
            is_approved=True,
            store_products__is_available=True,
            store_products__stock_quantity__gt=0,
            store_products__store__is_active=True
        ).select_related("brand").prefetch_related("store_products__store").distinct()

        exclude_id = self.request.query_params.get("exclude_id")
        if exclude_id and exclude_id.isdigit():
            queryset = queryset.exclude(id=int(exclude_id))

        return queryset

    def list(self, request, *args, **kwargs):
        limit_raw = request.query_params.get("limit", 10)
        try:
            limit = int(limit_raw)
            if limit <= 0:
                return Response(
                    {"detail": "O parâmetro 'limit' deve ser um número inteiro positivo."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            limit = min(limit, 50)
        except (ValueError, TypeError):
            return Response(
                {"detail": "O parâmetro 'limit' deve ser um valor numérico inteiro válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self.get_queryset()
        user = request.user

        followed_store_ids = set()
        is_personalized = False

        if user and user.is_authenticated:
            followed_store_ids = set(
                StoreFollower.objects.filter(user=user).values_list("store_id", flat=True)
            )
            user_families = getattr(user, "olfactory_families", []) or []
            user_notes = getattr(user, "preferred_notes", []) or []
            if user_families or user_notes:
                is_personalized = True

        serializer_context = {
            "request": request,
            "followed_store_ids": followed_store_ids,
        }

        products = list(queryset)

        if is_personalized:
            for p in products:
                match_data = calculate_olfactory_match(user, p, followed_store_ids)
                p._calculated_match = match_data["match_percentage"] or 0
            products.sort(key=lambda x: (x._calculated_match, getattr(x, "sold_count", 0)), reverse=True)
        else:
            products.sort(key=lambda x: getattr(x, "sold_count", 0), reverse=True)

        products = products[:limit]
        serializer = self.get_serializer(products, many=True, context=serializer_context)

        return Response({
            "is_personalized": is_personalized,
            "count": len(products),
            "results": serializer.data
        })