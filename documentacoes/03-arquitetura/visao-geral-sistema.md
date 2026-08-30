# Visão Geral da Arquitetura

O sistema NŌTA é baseado em uma arquitetura Cliente-Servidor clássica, utilizando o padrão API-first. O Backend atua como a única fonte de verdade e atende a dois clientes (frontends) distintos.

## Diagrama de Blocos Macro

```text
+-------------------+      +-------------------+      +-------------------+
|                   |      |                   |      |                   |
|   App Mobile      |      |   Painel Web      |      |   Painel Admin    |
|   (Cliente B2C)   +----->+   (Lojista)       +----->+   (Plataforma)    |
|   React Native    |      |   React/Next.js   |      |   Django Admin/   |
|   Expo Router     |      |                   |      |   React           |
+--------+----------+      +---------+---------+      +---------+---------+
         |                           |                          |
         | (REST JSON / JWT)         | (REST JSON / JWT)        | (REST / Session)
         v                           v                          v
+-------------------------------------------------------------------------+
|                                                                         |
|                          BACKEND (API RESTful)                          |
|                          Django REST Framework                          |
|                                                                         |
|   +----------------+   +-----------------+   +----------------------+   |
|   | Auth & Users   |   | Multi-tenant    |   | Catalog & Olfactory  |   |
|   | (JWT)          |   | Logic (Store_id)|   | Search Engine        |   |
|   +----------------+   +-----------------+   +----------------------+   |
|                                                                         |
+------------------------------------+------------------------------------+
                                     |
                                     v
                       +---------------------------+
                       |                           |
                       |    SQLITE (dev)           |
                       |    db.sqlite3             |
                       |    (via Django ORM)       |
                       +---------------------------+
```

## Componentes Principais

1.  **Backend (Django + Django REST Framework - DRF):**
    *   Fornece APIs RESTful.
    *   **Autenticação JWT (JSON Web Tokens):** Todas as rotas privadas exigem um token Bearer.
    *   **Isolamento Multi-tenant Lógico:** A separação de dados dos lojistas ocorre a nível lógico na aplicação. O DRF utilizará middlewares ou classes de permissão (ex: `BasePermission`) para garantir que queries (QuerySets) sempre filtrem pelo `store_id` do usuário logado (quando perfil for Lojista).
    *   **Comunicação de Status de Pedido:** O backend gerencia as máquinas de estado dos pedidos. Atualizações podem ser enviadas via webhooks para integrações futuras ou consultadas (polling/refresh) pelos clientes.

2.  **Camada de Persistência (SQLite via Django ORM):**
    *   Em desenvolvimento, o banco de dados é um arquivo único `db.sqlite3` na raiz do projeto Django, sem necessidade de instalação de servidor.
    *   O Django ORM abstrai completamente o banco, tornando a migração para outro engine (ex.: PostgreSQL em produção) transparente — basta alterar a chave `DATABASES` no `settings.py`.
    *   Todas as migrações de schema são gerenciadas por `python manage.py makemigrations` e `migrate`.

2.  **App Mobile (React Native + Expo):**
    *   Focado na experiência do usuário final, vitrine atraente e busca olfativa avançada.

3.  **Painel Web (React/Next.js ou Vite):**
    *   Focado em produtividade para o lojista, tabelas de dados, gestão de estoque e acompanhamento de fluxo logístico.
