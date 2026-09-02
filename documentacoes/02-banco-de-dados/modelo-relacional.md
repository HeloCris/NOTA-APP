# Modelo Relacional (Django ORM / SQLite)

Abaixo estão as principais entidades do sistema e seus relacionamentos, pensados para suportar o modelo multi-tenant e o catálogo global.

> **Banco de dados de desenvolvimento:** SQLite (arquivo local `db.sqlite3`), gerenciado integralmente pelo Django ORM. Por ser schemaless a nível de engine, toda a definição de tipos, constraints e índices é delegada ao ORM e às migrations do Django. A migração para um banco de produção (ex.: PostgreSQL) no futuro requer apenas alterar `DATABASES` no `settings.py`.

### Compatibilidade de Tipos com SQLite via Django ORM

| Tipo Django | Tipo Nativo SQLite | Observação |
| :--- | :--- | :--- |
| `AutoField` / `BigAutoField` | `INTEGER` | PK com auto-increment nativo |
| `CharField` / `TextField` | `TEXT` | SQLite não distingue; ORM define `max_length` |
| `IntegerField` | `INTEGER` | - |
| `DecimalField(max_digits, decimal_places)` | `NUMERIC` / `TEXT` | SQLite armazena como TEXT; Django cuida da precisão |
| `BooleanField` | `INTEGER` (0 ou 1) | Django mapeia automaticamente |
| `DateTimeField` | `TEXT` (ISO 8601) | Django formata e parseia |
| `JSONField` | `TEXT` (JSON serializado) | Suportado a partir do Django 3.1 com SQLite |

> **Atenção:** Campos `top_notes`, `heart_notes` e `base_notes` serão armazenados como `JSONField` (serialização de lista). Em SQLite, isso é armazenado como texto JSON nativo, sem suporte a queries nativas de array como no PostgreSQL. Filtros complexos sobre esses campos devem ser feitos em Python após a query inicial.

## Entidades Principais

*   **`User` (AbstractUser/Custom):** Usuários do sistema (Admins, Lojistas e Clientes). Deve possuir um campo `role` ou utilizar grupos do Django para diferenciar os perfis.
*   **`Store` (Loja/Tenant):** Representa o lojista.
*   **`Brand` (Marca):** Marca dos perfumes (ex: Carolina Herrera, Dior).
*   **`Product` (Catálogo Global):** O perfume em si, independente de quem o vende.
*   **`StoreProduct` (Estoque/Preço):** O relacionamento entre a Loja e o Produto, definindo condições de venda específicas daquele tenant.
*   **`Order` (Pedido):** Um pedido feito a uma loja específica.
*   **`OrderItem` (Item do Pedido):** Os produtos dentro de um pedido.

## Relacionamentos

*   **`User` (Lojista) 1:N `Store`** (Geralmente 1:1, mas 1:N permite que um usuário gerencie múltiplas filiais). No mínimo, uma `Store` tem uma `ForeignKey` para o `User` (Owner).
*   **`Brand` 1:N `Product`:** Uma marca possui vários produtos. `Product` tem `ForeignKey(Brand)`.
*   **`Product` N:M `Store` através de `StoreProduct`:** Um produto pode ser vendido por várias lojas, e uma loja vende vários produtos. `StoreProduct` é a tabela pivô (intermediária), contendo `ForeignKey(Product)` e `ForeignKey(Store)`.
*   **`User` (Cliente) 1:N `Order`:** Um cliente pode fazer vários pedidos. `Order` tem `ForeignKey(User, related_name='orders')`.
*   **`Store` 1:N `Order`:** Um pedido pertence a uma única loja (para garantir o isolamento e split de pagamentos). `Order` tem `ForeignKey(Store)`.
*   **`Order` 1:N `OrderItem`:** Um pedido tem vários itens. `OrderItem` tem `ForeignKey(Order)`.
*   **`StoreProduct` 1:N `OrderItem`:** O item do pedido faz referência ao produto específico da loja no momento da compra (para rastrear o preço cobrado). `OrderItem` tem `ForeignKey(StoreProduct)`.

## Índices Recomendados

Para otimizar consultas, especialmente na vitrine do app. No Django, índices são declarados via `db_index=True` no campo ou via classe `Meta` do model:

*   Índice em `StoreProduct.store_id` (Essencial para filtrar o painel do lojista).
*   Índice composto em `StoreProduct(store_id, product_id)` — definido via `Meta.indexes = [models.Index(fields=['store_id', 'product_id'])]`.
*   Índice em `Product.brand_id`.
*   Índice em `Product.olfactory_family` para filtros de busca olfativa.
*   Índice em `Order.store_id` e `Order.customer_id`.

> **Nota SQLite:** O SQLite suporta índices normais e compostos via `CREATE INDEX`. O Django gera esses índices automaticamente nas migrations quando declarados no model.
