# Estrutura do App Mobile (React Native + Expo Router)

O App Cliente será desenvolvido em React Native utilizando o framework Expo e a navegação baseada em arquivos (file-based routing) do **Expo Router**.

## Árvore de Diretórios Sugerida

```text
mobile-app/
├── src/
│   ├── app/                    # Rotas da aplicação (Expo Router)
│   │   ├── _layout.tsx         # Layout raiz (Providers, Auth guard)
│   │   ├── index.tsx           # Ponto de entrada (redireciona p/ auth ou shop)
│   │   ├── (auth)/             # Grupo de rotas não autenticadas
│   │   │   ├── login.tsx       # Tela de Login
│   │   │   ├── register.tsx    # Tela de Cadastro
│   │   │   └── _layout.tsx     # Layout específico de auth
│   │   ├── (shop)/             # Grupo de rotas principais (Tab Bar)
│   │   │   ├── _layout.tsx     # Definição das Tabs inferiores
│   │   │   ├── index.tsx       # Tab: Início / Vitrine
│   │   │   ├── search.tsx      # Tab: Busca (Olfativa / Texto)
│   │   │   ├── cart.tsx        # Tab: Carrinho
│   │   │   └── profile.tsx     # Tab: Minha Conta
│   │   └── product/            # Rotas dinâmicas
│   │       └── [id].tsx        # Detalhes do Produto
│   │
│   ├── components/             # Componentes de UI reutilizáveis
│   │   ├── common/             # Botões, Inputs, Headers
│   │   ├── product/            # ProductCard, OlfactoryPyramidView
│   │   └── cart/               # CartItem, CartSummary
│   │
│   ├── services/               # Camada de comunicação com a API
│   │   ├── api.ts              # Instância do Axios/Fetch configurada
│   │   ├── auth.ts             # Chamadas de login/registro
│   │   ├── catalog.ts          # Chamadas de produtos e busca
│   │   └── orders.ts           # Chamadas de carrinho e pedidos
│   │
│   ├── context/                # Gerenciamento de Estado Global (Context API ou Zustand)
│   │   ├── AuthContext.tsx     # Estado do usuário logado
│   │   └── CartContext.tsx     # Gerenciamento do carrinho multi-loja
│   │
│   ├── utils/                  # Funções auxiliares (formatação de moeda, datas)
│   ├── constants/              # Cores, Temas, URLs
│   └── assets/                 # Imagens, fontes locais
│
├── package.json
└── app.json                    # Configurações do Expo
```
