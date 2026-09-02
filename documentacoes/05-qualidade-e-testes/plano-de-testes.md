# Plano de Testes — NŌTA Marketplace

Este documento descreve a estratégia de qualidade do projeto NŌTA, cobrindo as camadas de Backend, API e Frontend.

---

## 1. Testes Unitários e de Integração — Backend (Django / Pytest)

Utilizamos `pytest` com `pytest-django` como runner principal. Para testes de integração, a base de dados é o **SQLite em memória (`:memory:`)**, configurado automaticamente pelo Django ao detectar que o banco padrão já é SQLite. Isso garante execução extremamente rápida (sem I/O de disco) e isolamento total entre os runs.

**Configuração necessária em `pytest.ini` (ou `pyproject.toml`):**

```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
addopts = --reuse-db  # Opcional: reutiliza a estrutura do DB entre runs para agilidade
```

**Configuração no `settings.py` para testes (automático com SQLite):**

```python
# O Django usa automaticamente :memory: para SQLite em testes.
# Nenhuma configuração extra necessária.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
```

### 1.1 Autenticação JWT

| ID | Caso de Teste | Tipo | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| `AUTH-01` | Login com credenciais válidas | Unitário | Retorna `access_token` e `refresh_token` válidos |
| `AUTH-02` | Login com senha incorreta | Unitário | Raise `AuthenticationError` / HTTP 401 |
| `AUTH-03` | Acesso a rota privada com token expirado | Integração | HTTP 401 com detalhe `token_not_valid` |
| `AUTH-04` | Renovação do `access_token` via `refresh_token` | Integração | Novo `access_token` é retornado com HTTP 200 |
| `AUTH-05` | Acesso de Lojista a rota exclusiva de Admin | Integração | HTTP 403 Forbidden |

```python
# Exemplo de teste (pytest)
# tests/test_auth.py

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_login_valido_retorna_tokens(api_client, user_factory):
    user = user_factory(role="CUSTOMER", password="senha_segura_123")
    response = api_client.post(reverse("token_obtain_pair"), {
        "email": user.email,
        "password": "senha_segura_123",
    })
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data
```

### 1.2 Isolamento Multi-Tenant

> **Regra de Ouro:** A Loja A **jamais** pode acessar, listar ou modificar dados da Loja B.

| ID | Caso de Teste | Tipo | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| `MT-01` | Lojista A tenta listar pedidos da Loja B | Integração | QuerySet retorna vazio (0 resultados) |
| `MT-02` | Lojista A tenta acessar `Order` específico da Loja B via ID | Integração | HTTP 404 Not Found |
| `MT-03` | Lojista A tenta editar `StoreProduct` de Loja B | Integração | HTTP 403 Forbidden |
| `MT-04` | QuerySet de `Order` do lojista sempre filtra por `store_id` | Unitário | Verifica cláusula `WHERE store_id=X` no SQL gerado |

```python
# Exemplo de teste de isolamento
# tests/test_multitenancy.py

@pytest.mark.django_db
def test_lojista_nao_ve_pedidos_de_outra_loja(api_client, store_factory, order_factory):
    loja_a, loja_b = store_factory(), store_factory()
    order_factory(store=loja_b)  # Pedido pertence à Loja B

    api_client.force_authenticate(user=loja_a.owner)
    response = api_client.get(reverse("order-list"))

    assert response.status_code == 200
    assert len(response.data["results"]) == 0  # Loja A não enxerga o pedido
```

### 1.3 Validação de Estoque ao Criar Pedido

| ID | Caso de Teste | Tipo | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| `STOCK-01` | Pedido com quantidade ≤ estoque disponível | Unitário | Pedido criado com sucesso, estoque decrementado |
| `STOCK-02` | Pedido com quantidade > estoque disponível | Unitário | Raise `InsufficientStockError` / HTTP 400 |
| `STOCK-03` | Dois pedidos simultâneos disputando o último estoque | Integração | Apenas um pedido é confirmado (uso de `select_for_update`) |
| `STOCK-04` | Pedido cancelado devolve o estoque ao produto | Integração | `StoreProduct.stock` é incrementado corretamente |

> **Nota SQLite:** O SQLite tem suporte limitado a concorrência. O caso `STOCK-03` (pedidos simultâneos) pode não refletir o comportamento real em produção. Em ambiente de teste com SQLite, este caso deve ser simulado com mocks ou testado em fluxo sequencial, documentando a limitação.

### 1.4 Cálculo de Totais do Pedido

| ID | Caso de Teste | Tipo | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| `CALC-01` | Total do pedido = Σ (unit_price × quantity) + frete | Unitário | Valor calculado bate com valor armazenado em `Order.total_amount` |
| `CALC-02` | Alteração de preço do `StoreProduct` não afeta pedidos já fechados | Unitário | `OrderItem.unit_price` (snapshot) permanece inalterado |
| `CALC-03` | Pedido com múltiplos itens tem total correto | Unitário | Soma de todos os `OrderItem` corresponde ao total do `Order` |

---

## 2. Testes de API — Endpoints REST

Cobertura das respostas HTTP esperadas para cada endpoint crítico.

### 2.1 Códigos de Resposta Esperados

| Método | Endpoint | Cenário | HTTP Esperado |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/token/` | Credenciais válidas | **200 OK** |
| `POST` | `/api/auth/token/` | Credenciais inválidas | **401 Unauthorized** |
| `GET` | `/api/products/` | Listagem pública do catálogo | **200 OK** |
| `POST` | `/api/store/products/` | Lojista cria StoreProduct (auth OK) | **201 Created** |
| `POST` | `/api/store/products/` | Lojista envia payload inválido | **400 Bad Request** |
| `GET` | `/api/store/products/{id}/` | Lojista acessa próprio StoreProduct | **200 OK** |
| `GET` | `/api/store/products/{id}/` | Lojista acessa StoreProduct de outra loja | **404 Not Found** |
| `GET` | `/api/admin/stores/` | Cliente tenta acessar rota de Admin | **403 Forbidden** |
| `GET` | `/api/orders/{id}/` | ID de pedido inexistente | **404 Not Found** |
| `PATCH` | `/api/orders/{id}/status/` | Avanço de status válido (PENDING → PROCESSING) | **200 OK** |
| `PATCH` | `/api/orders/{id}/status/` | Retrocesso de status inválido | **400 Bad Request** |

### 2.2 Exemplo de Teste de API

```python
# tests/test_api_orders.py

@pytest.mark.django_db
def test_patch_order_status_invalido_retorna_400(api_client, seller_auth, order_factory):
    order = order_factory(store=seller_auth.store, status="DELIVERED")
    api_client.force_authenticate(user=seller_auth.owner)
    
    response = api_client.patch(
        reverse("order-update-status", kwargs={"pk": order.pk}),
        {"status": "PENDING"}  # Retroceder para PENDING é inválido
    )
    assert response.status_code == 400
    assert "status" in response.data
```

---

## 3. Testes de Interface (Frontend Web & Mobile)

### 3.1 Painel Web (React — Vitest + React Testing Library)

| ID | Componente / Tela | Caso de Teste | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| `UI-W-01` | `<LoginForm />` | Renderiza campos de e-mail e senha | Elementos visíveis no DOM |
| `UI-W-02` | `<LoginForm />` | Submit com campos vazios exibe mensagens de erro | Mensagens de validação renderizadas |
| `UI-W-03` | `<ProductForm />` | Preencher e submeter formulário de novo produto | Função `onSubmit` chamada com dados corretos |
| `UI-W-04` | `<OrdersTable />` | Renderiza lista de pedidos corretamente | Todas as linhas da tabela são renderizadas |
| `UI-W-05` | `<OrdersTable />` | Botão "Marcar como Enviado" exibe campo de rastreio | Modal/Input de código de rastreio aparece |

```typescript
// Exemplo (Vitest + Testing Library)
// src/features/orders/__tests__/OrdersTable.test.tsx

import { render, screen } from "@testing-library/react";
import { OrdersTable } from "../OrdersTable";
import { mockOrders } from "@/mocks/orders";

test("renderiza a tabela de pedidos com todos os itens", () => {
  render(<OrdersTable orders={mockOrders} />);
  mockOrders.forEach((order) => {
    expect(screen.getByText(order.id)).toBeInTheDocument();
  });
});
```

### 3.2 App Mobile (React Native — Jest + React Native Testing Library)

| ID | Tela / Componente | Caso de Teste | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| `UI-M-01` | `<ProductCard />` | Renderiza nome, preço e imagem do produto | Elementos visíveis |
| `UI-M-02` | `<OlfactoryPyramidView />` | Exibe as 3 camadas (Saída, Corpo, Fundo) | Três seções renderizadas com as notas corretas |
| `UI-M-03` | `<CartScreen />` | Itens de lojas diferentes ficam agrupados | Dois grupos distintos na tela |
| `UI-M-04` | Fluxo Checkout | Progresso de Endereço → Pagamento → Confirmação | Cada tela é navegada em sequência sem erros |
| `UI-M-05` | `<SearchScreen />` | Seleção de nota olfativa adiciona ao filtro | Estado de filtro é atualizado |
| `UI-M-06` | Formulário de Cadastro | Submit sem preencher e-mail exibe erro | Mensagem de validação exibida |

---

## 4. Matriz de Rastreabilidade — Testes × Casos de Uso Críticos

Vinculação dos testes às regras de negócio documentadas em `01-regras-de-negocio/`.

| Caso de Uso Crítico | IDs dos Testes Cobrindo |
| :--- | :--- |
| UC-01: Autenticação segura e emissão de JWT | `AUTH-01`, `AUTH-02`, `AUTH-03`, `AUTH-04` |
| UC-02: Controle de acesso por papel (Admin/Lojista/Cliente) | `AUTH-05`, `MT-03` |
| UC-03: Isolamento de dados entre tenants (lojas) | `MT-01`, `MT-02`, `MT-03`, `MT-04` |
| UC-04: Compra com validação de estoque em tempo real | `STOCK-01`, `STOCK-02`, `STOCK-03` |
| UC-05: Integridade financeira dos totais do pedido | `CALC-01`, `CALC-02`, `CALC-03` |
| UC-06: Ciclo de vida / máquina de estados do pedido | Endpoint `PATCH /orders/{id}/status/`, `UI-W-05` |
| UC-07: Gestão de produtos pelo lojista (Painel Web) | `UI-W-03`, `UI-W-04` |
| UC-08: Busca olfativa por notas/famílias (App Mobile) | `UI-M-02`, `UI-M-05` |
| UC-09: Carrinho multi-loja com split correto | `UI-M-03`, `UI-M-04` |
| UC-10: Cadastro de cliente e validação de formulário | `UI-M-06`, `UI-W-02` |
