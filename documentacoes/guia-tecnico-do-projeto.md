# Guia técnico do NŌTA

Este guia consolida a estrutura e os comandos de desenvolvimento das aplicações com base no código-fonte do repositório. Ele descreve a implementação identificada no projeto; documentos de requisitos e de sprints podem registrar funcionalidades planejadas ou em evolução.

## Visão geral

O NŌTA é composto por três aplicações:

| Aplicação | Tecnologias | Responsabilidade |
|---|---|---|
| Backend | Python, Django 5.2, Django REST Framework e Simple JWT | API REST, autenticação, regras de domínio e persistência |
| Mobile | React Native, Expo Router e TypeScript | Aplicativo do consumidor para Android, iOS e web |
| Web | React, TypeScript, Vite e React Router | Portal web com experiências para lojistas, marcas e administração |

O backend é o ponto de integração dos clientes e utiliza o Django ORM. A configuração atual usa SQLite (`backend/db.sqlite3`). A comunicação da API é baseada em JSON; arquivos de mídia são disponibilizados pelo Django durante o desenvolvimento.

```text
Aplicativo Expo ─┐
                ├── HTTP/JSON + JWT ──> Django REST Framework ──> Django ORM ──> SQLite
Portal React ───┘
```

## Estrutura do repositório

```text
backend/
  config/           Configurações Django, ASGI/WSGI e rotas principais
  apps/             Aplicações de domínio do backend
  media/            Arquivos enviados pela aplicação
mobile/
  src/app/          Rotas e telas Expo Router
  src/components/   Componentes reutilizáveis
  src/context/      Contextos compartilhados, como autenticação e carrinho
  src/services/     Acesso à API
  src/types/        Tipos TypeScript
  src/utils/        Utilitários, incluindo armazenamento local
web/
  src/pages/        Páginas do portal
  src/features/     Funcionalidades agrupadas por domínio
  src/components/   Componentes reutilizáveis
  src/services/     Serviços de acesso à API
  src/lib/          Infraestrutura compartilhada, incluindo o cliente HTTP
documentacoes/
  01-regras-de-negocio/
  02-banco-de-dados/
  03-arquitetura/
  04-interfaces-e-telas/
  05-fluxos/
  05-qualidade-e-testes/
  sprints/
```

## Backend

### Aplicações de domínio

As rotas principais do projeto incluem estas aplicações:

| Aplicação | Escopo observado no código |
|---|---|
| `users` | Cadastro, login JWT, autenticação Google, perfil, perfil olfativo e endereços |
| `stores` | Consulta e manutenção da loja, produtos da loja, dashboard, seguir loja e cotação de frete |
| `catalog` | Marcas e produtos, cadastro/onboarding de marca, aprovação administrativa e ativação D2C |
| `inventory` | Cadastro, consulta, atualização e remoção de produtos do estoque de uma loja |
| `showcase` | Consulta de produtos e detalhes públicos de loja |
| `orders` | Pedidos, processamento de pagamento e operações de processamento/envio da loja |
| `core` | Aplicação compartilhada; não possui rotas próprias registradas em `config/urls.py` |

As pastas `communication` e `reviews` existem em `backend/apps`, mas não estão registradas como aplicações ativas em `INSTALLED_APPS` nem incluídas nas rotas principais. Portanto, não são consideradas endpoints disponíveis com base na configuração atual.

### Prefixos de API registrados

As rotas da API são montadas em `backend/config/urls.py`:

| Prefixo | Aplicação |
|---|---|
| `/api/v1/auth/` | `users` |
| `/api/v1/stores/` | `stores` |
| `/api/v1/` | `catalog`, `inventory` e `orders` |
| `/api/v1/showcase/` | `showcase` |
| `/admin/` | Django Admin |

Entre os recursos registrados estão autenticação e perfil, lojas, marcas, produtos, produtos em estoque, vitrine, pedidos e processamento de pagamento. Os métodos e payloads devem ser conferidos nas rotas e views do backend; a especificação da API é uma referência complementar e pode incluir funcionalidades em evolução.

### Autenticação e configuração

- O DRF usa autenticação JWT Bearer por padrão e exige usuário autenticado, exceto quando uma view define outra permissão.
- A configuração define access token com duração de 60 minutos e refresh token de 7 dias, com rotação e blacklist após rotação.
- A paginação padrão é por página, com 20 itens.
- O arquivo `backend/config/settings.py` carrega variáveis de `backend/.env`, quando disponível. As variáveis usadas incluem `SECRET_KEY`, `DEBUG` e `ALLOWED_HOSTS`.
- CORS aceita todas as origens quando `DEBUG` está habilitado; em desenvolvimento, também há origens locais explicitamente configuradas.
- O banco configurado é SQLite. Mudanças de esquema devem ser feitas por migrations do Django.

Não use os valores de desenvolvimento nem `DEBUG=True` em produção. Configure uma chave secreta própria e restrinja hosts e origens permitidos antes de publicar o serviço.

## Aplicativo mobile

O aplicativo usa Expo Router com rotas definidas por arquivos em `mobile/src/app/`. A navegação organiza as áreas de autenticação (`(auth)`) e da loja (`(shop)`). O layout raiz compartilha os contextos de autenticação e carrinho e direciona usuários conforme o estado de sessão.

As telas identificadas incluem:

- autenticação, cadastro e onboarding;
- início, busca/exploração e detalhes de produto;
- vitrine de loja;
- carrinho e etapas de checkout (sacola, entrega, pagamento e confirmação);
- pedidos e detalhes de pedido;
- conta, endereços, métodos de pagamento e perfil olfativo.

O cliente HTTP está em `mobile/src/services/api.ts`. Durante o desenvolvimento, ele monta a URL da API usando o endereço do host do Expo e a porta `8000`. Tokens são mantidos por utilitários de armazenamento seguro e o cliente tenta renovar a sessão quando recebe uma resposta 401.

## Portal web

O portal usa React Router; as rotas centrais estão em `web/src/App.tsx`. As páginas incluem boas-vindas, login/cadastro, vitrine pública de loja, onboarding e status de marca, além de áreas protegidas de administração, lojista e marca.

O cliente HTTP está em `web/src/lib/apiClient.ts`. A URL base pode ser definida por `VITE_API_BASE_URL`; sem essa variável, o cliente usa `http://127.0.0.1:8000/api/v1`. O cliente adiciona o token de acesso às chamadas e tenta renovar tokens expirados.

## Executar localmente

### Backend (PowerShell)

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

O endereço `0.0.0.0` permite acesso a partir de outros dispositivos na rede local, necessário para testar o aplicativo mobile em um dispositivo físico. Se estiver executando apenas no computador, `python manage.py runserver` é suficiente para acessar a API em `127.0.0.1:8000`.

### Aplicativo mobile

Em outro terminal:

```powershell
cd mobile
npm install
npm start
```

Use o Expo Go, um emulador ou uma build de desenvolvimento conforme a configuração local do Expo.

### Portal web

Em outro terminal:

```powershell
cd web
npm install
npm run dev
```

Se a API não estiver em `http://127.0.0.1:8000/api/v1`, configure `VITE_API_BASE_URL` antes de iniciar o Vite. Por exemplo:

```powershell
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000/api/v1"
npm run dev
```

## Testes e verificações

Execute os comandos na pasta indicada:

| Projeto | Testes | Lint / build |
|---|---|---|
| Backend | `python -m pytest` em `backend` | `python manage.py check` em `backend` |
| Mobile | `npm test` em `mobile` | `npm run lint` em `mobile` |
| Web | `npm test` em `web` | `npm run lint` e `npm run build` em `web` |

O backend está configurado para descobrir arquivos `tests.py`, `test_*.py` e `*_tests.py`. A suíte mobile usa Jest/Expo e a web usa Vitest.

## Documentação relacionada

- [Regras e fluxos de negócio](./01-regras-de-negocio/fluxos-de-negocio.md)
- [Perfis e permissões](./01-regras-de-negocio/perfis-e-permissoes.md)
- [Políticas de permissões do DRF](./01-regras-de-negocio/politicas-permissoes-drf.md)
- [Dicionário de dados](./02-banco-de-dados/dicionario-de-dados.md)
- [Modelo relacional](./02-banco-de-dados/modelo-relacional.md)
- [Especificação da API REST](./03-arquitetura/especificacao-api-rest.md)
- [Estrutura do projeto](./03-arquitetura/estrutura-pastas-projeto.md)
- [Estrutura do aplicativo mobile](./03-arquitetura/estrutura-app-mobile-expo.md)
- [Estrutura do portal web](./03-arquitetura/estrutura-web-lojista.md)
- [Mapa de telas mobile](./04-interfaces-e-telas/mapa-de-telas-mobile.md)
- [Mapa de telas web](./04-interfaces-e-telas/mapa-de-telas-web.md)
- [Plano de testes](./05-qualidade-e-testes/plano-de-testes.md)

## Manutenção desta documentação

Ao alterar rotas, aplicações instaladas, versões de tecnologias ou comandos de execução, atualize este guia junto com os documentos específicos relacionados. Para descrever uma funcionalidade como disponível, confirme sua implementação nas rotas, views e clientes que a utilizam; requisitos de sprint, isoladamente, não comprovam que uma funcionalidade está ativa.
