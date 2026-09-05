# Estrutura de Pastas do Projeto — NŌTA Monorepo

Mapeamento da árvore de diretórios do monorepo com vínculo explícito às RFs da Sprint 1.

---

## Árvore Completa

```
nota-marketplace/
├── documentacoes/
│   ├── 01-regras-de-negocio/
│   ├── 02-banco-de-dados/
│   ├── 03-arquitetura/
│   ├── 04-interfaces-e-telas/
│   ├── 05-qualidade-e-testes/
│   └── sprints/sprint-1/
│
├── backend/                                      # Django REST Framework + SQLite
│   ├── manage.py
│   ├── db.sqlite3
│   ├── requirements.txt
│   ├── core/                                     # Configurações globais
│   │   ├── settings.py                           # AUTH_USER_MODEL, SIMPLE_JWT, DRF
│   │   ├── urls.py                               # Roteador raiz /api/v1/
│   │   └── wsgi.py
│   └── apps/
│       ├── authentication/                       # ─── RF-01 ───
│       │   ├── models.py                         # CustomUser (AbstractBaseUser)
│       │   ├── managers.py                       # CustomUserManager (sem username)
│       │   ├── serializers.py                    # RegisterSerializer, CustomTokenSerializer
│       │   ├── views.py                          # RegisterView, MeView
│       │   ├── urls.py                           # /auth/register/, /auth/me/
│       │   ├── permissions.py                    # IsPlatformAdmin, IsStoreOwner, IsCustomerOwner
│       │   └── tests/
│       │       └── test_auth.py
│       │
│       ├── stores/                               # ─── RF-02 ───
│       │   ├── models.py                         # Store (OneToOne → User, slug, cnpj, bio)
│       │   ├── serializers.py                    # StoreSerializer, StoreUpdateSerializer
│       │   ├── views.py                          # StoreCreateView, StoreMeView
│       │   ├── urls.py                           # /stores/, /stores/me/
│       │   └── tests/
│       │       └── test_stores.py
│       │
│       └── products/                             # ─── RF-03 + RF-04 + RF-05 ───
│           ├── models.py                         # Brand, Product (RF-03) | StoreProduct (RF-04)
│           ├── serializers.py                    # BrandSerializer, ProductSerializer,
│           │                                     # StoreProductSerializer, ShowcaseSerializer
│           ├── views/
│           │   ├── catalog_views.py              # [RF-03] BrandListView, ProductListView
│           │   ├── inventory_views.py            # [RF-04] StoreProductViewSet (CRUD)
│           │   └── showcase_views.py             # [RF-05] ShowcaseProductsView, StoreShowcaseView
│           ├── urls.py                           # Agrega rotas dos 3 módulos acima
│           ├── filters.py                        # Filtros DRF (família, notas, preço, slug)
│           ├── management/
│           │   └── commands/
│           │       └── seed_catalog.py           # [RF-03] Carga inicial de marcas e perfumes
│           └── tests/
│               ├── test_catalog.py               # [RF-03] Seeds e filtros de busca
│               ├── test_inventory.py             # [RF-04] Estoque, preços, multi-tenant
│               └── test_showcase.py             # [RF-05] Visibilidade pública
│
└── frontend-web/                                 # React + Vite — Seller Hub & Vitrine
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── assets/                               # Logos, ícones, imagens editoriais
        │
        ├── types/                                # Interfaces TypeScript globais
        │   └── index.ts                          # User, Store, Product, StoreProduct, Order
        │
        ├── services/                             # Camada HTTP (Axios)
        │   ├── api.ts                            # [RF-01] Instância Axios + interceptors JWT
        │   ├── authService.ts                    # [RF-01] login(), register(), me()
        │   ├── storeService.ts                   # [RF-02] getMyStore(), updateStore()
        │   ├── catalogService.ts                 # [RF-03] getProducts(), getBrands()
        │   ├── inventoryService.ts               # [RF-04] CRUD de StoreProduct
        │   └── showcaseService.ts                # [RF-05] getShowcase(), getStoreBySlug()
        │
        ├── contexts/
        │   └── AuthContext.tsx                   # [RF-01] user, isAuthenticated, login(), logout()
        │
        ├── hooks/
        │   ├── useAuth.ts                        # [RF-01] Acesso ao AuthContext
        │   ├── useDebounce.ts                    # [RF-05] Debounce para busca/autocomplete
        │   └── useInventory.ts                   # [RF-04] Estado e ações da tabela de estoque
        │
        ├── components/
        │   ├── ui/                               # Primitivos reutilizáveis (todos os RFs)
        │   │   ├── Button.tsx
        │   │   ├── Input.tsx
        │   │   ├── Modal.tsx
        │   │   ├── Badge.tsx                     # [RF-03/05] Badges de notas olfativas e volume
        │   │   └── Toggle.tsx                    # [RF-04] Switch ativo/inativo do produto
        │   │
        │   ├── layout/                           # [RF-02] Shell do Seller Hub
        │   │   ├── Sidebar.tsx
        │   │   ├── Header.tsx
        │   │   └── SellerLayout.tsx              # Wrapper com Sidebar + Header
        │   │
        │   └── domain/
        │       ├── OlfactoryPyramid/             # [RF-03] Visualização das 3 camadas olfativas
        │       │   └── OlfactoryPyramidModal.tsx
        │       ├── InventoryTable/               # [RF-04] Tabela de estoque
        │       │   └── InventoryTable.tsx
        │       └── ProductCard/                  # [RF-05] Card editorial da vitrine
        │           └── ProductCard.tsx
        │
        ├── pages/
        │   ├── auth/                             # [RF-01]
        │   │   ├── LoginPage.tsx
        │   │   └── RegisterPage.tsx
        │   ├── onboarding/                       # [RF-02]
        │   │   └── StoreProfilePage.tsx
        │   ├── catalog/                          # [RF-03]
        │   │   └── CatalogSearchPage.tsx
        │   ├── inventory/                        # [RF-04]
        │   │   └── InventoryPage.tsx
        │   └── showcase/                         # [RF-05]
        │       └── StoreShowcasePage.tsx         # Rota: /lojas/:slug
        │
        └── routes/
            ├── index.tsx                         # Definição de todas as rotas
            └── ProtectedRoute.tsx                # [RF-01] Guard por role
```

---

## Mapeamento RF → Arquivos

| RF | Backend | Frontend |
| :--- | :--- | :--- |
| **RF-01** | `apps/authentication/` completo + `core/settings.py` | `AuthContext`, `useAuth`, `api.ts`, `pages/auth/`, `ProtectedRoute` |
| **RF-02** | `apps/stores/` completo | `components/layout/`, `pages/onboarding/`, `storeService.ts` |
| **RF-03** | `products/models.py` (Brand, Product), `catalog_views.py`, `seed_catalog.py` | `OlfactoryPyramidModal`, `CatalogSearchPage`, `catalogService.ts` |
| **RF-04** | `products/models.py` (StoreProduct), `inventory_views.py` | `InventoryTable`, `InventoryPage`, `inventoryService.ts`, `Toggle` |
| **RF-05** | `showcase_views.py`, `filters.py` | `ProductCard`, `StoreShowcasePage`, `showcaseService.ts`, `useDebounce` |

---

## Convenções

| Regra | Detalhe |
| :--- | :--- |
| **Apps Django** | Uma app por domínio de negócio; sem lógica em `settings.py` |
| **Views Django** | Views separadas por responsabilidade dentro de `products/views/` |
| **Serviços Frontend** | Um arquivo por domínio de API; Axios sempre via `api.ts` |
| **Componentes** | `ui/` = primitivos sem lógica de negócio; `domain/` = componentes com contexto do NŌTA |
| **Testes Backend** | Um arquivo de teste por módulo dentro de `apps/<modulo>/tests/` |
