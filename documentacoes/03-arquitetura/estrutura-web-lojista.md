# Estrutura do Painel Web (Lojista)

O Painel Web do lojista (Dashboard) será focado em gestão, utilizando React (com Vite ou Next.js).

## Árvore de Diretórios Sugerida (Base React)

```text
web-seller-panel/
├── src/
│   ├── assets/                 # Imagens, Ícones
│   ├── components/             # Componentes de UI genéricos
│   │   ├── ui/                 # Componentes base (Botões, Modais, Tabelas - ex: shadcn/ui)
│   │   ├── layout/             # Sidebar, Topbar, Layout Principal
│   │   └── forms/              # Inputs customizados
│   │
│   ├── features/               # Organização por domínio da aplicação (Padrão Feature Sliced Design simplificado)
│   │   ├── auth/               # Login, Recuperação de Senha
│   │   ├── dashboard/          # Métricas e Gráficos da Home
│   │   ├── inventory/          # Gestão de Estoque (StoreProduct)
│   │   ├── orders/             # Lista e Detalhes de Pedidos
│   │   └── settings/           # Dados da Loja, Frete
│   │
│   ├── pages/                  # Composição das views principais (Roteamento)
│   │   ├── Login.tsx
│   │   ├── DashboardOverview.tsx
│   │   ├── InventoryList.tsx
│   │   ├── OrderManagement.tsx
│   │   └── StoreSettings.tsx
│   │
│   ├── routes/                 # Definição do React Router
│   │   └── index.tsx           # Mapeamento de paths para Pages (com PrivateRoutes)
│   │
│   ├── services/               # Integração com Backend DRF
│   │   ├── apiClient.ts        # Axios com interceptors de JWT
│   │   └── endpoints/          # Funções separadas por entidade
│   │
│   ├── hooks/                  # Custom Hooks (ex: useAuth, useOrders)
│   ├── utils/                  # Formatadores e helpers
│   └── styles/                 # CSS global, temas (Tailwind config)
│
├── package.json
└── vite.config.ts
```
