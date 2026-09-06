# Estrutura do Painel Web (Lojista)

O Painel Web do lojista (Dashboard) será focado em gestão, utilizando React (com Vite ou Next.js).

## Árvore de Diretórios Sugerida (Base React)

```text
web/                                              # React + Vite — Seller Hub & Vitrine
├── index.html
├── package.json
├── vite.config.ts
└── src/
    ├── assets/                                   # Logos, ícones, imagens editoriais
    │
    ├── types/                                    # Interfaces TypeScript globais
    │   └── index.ts                              # User, Store, Product, StoreProduct, Order
    │
    ├── services/                                 # Camada HTTP (Axios)
    │   ├── api.ts                                # Instância Axios + interceptors JWT
    │   ├── authService.ts                        # login(), register(), me()
    │   ├── storeService.ts                       # getMyStore(), updateStore()
    │   ├── catalogService.ts                     # getProducts(), getBrands()
    │   ├── inventoryService.ts                   # CRUD de StoreProduct
    │   └── showcaseService.ts                    # getShowcase(), getStoreBySlug()
    │
    ├── contexts/                                 # Context API
    │   └── AuthContext.tsx                       # user, isAuthenticated, login(), logout()
    │
    ├── hooks/                                    # Custom Hooks
    │   ├── useAuth.ts                            # Acesso ao AuthContext
    │   ├── useDebounce.ts                        # Debounce para busca/autocomplete
    │   └── useInventory.ts                       # Estado e ações da tabela de estoque
    │
    ├── components/                               # Componentes React
    │   ├── ui/                                   # Primitivos reutilizáveis
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Badge.tsx
    │   │   └── Toggle.tsx
    │   │
    │   ├── layout/                               # Shell da aplicação
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   └── SellerLayout.tsx                  # Wrapper com Sidebar + Header
    │   │
    │   └── domain/                               # Componentes de domínio de negócio
    │       ├── OlfactoryPyramid/
    │       │   └── OlfactoryPyramidModal.tsx
    │       ├── InventoryTable/
    │       │   └── InventoryTable.tsx
    │       └── ProductCard/
    │           └── ProductCard.tsx
    │
    ├── pages/                                    # Páginas da aplicação
    │   ├── auth/
    │   │   ├── LoginPage.tsx
    │   │   └── RegisterPage.tsx
    │   ├── onboarding/
    │   │   └── StoreProfilePage.tsx
    │   ├── catalog/
    │   │   └── CatalogSearchPage.tsx
    │   ├── inventory/
    │   │   └── InventoryPage.tsx
    │   └── showcase/
    │       └── StoreShowcasePage.tsx
    │
    └── routes/                                   # Roteamento
        ├── index.tsx                             # Definição de todas as rotas
        └── ProtectedRoute.tsx                    # Guard por role
```
