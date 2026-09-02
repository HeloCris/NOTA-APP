# Dicionário de Dados

Especificação das principais tabelas e campos do banco de dados. Os tipos de dado listados seguem a notação do **Django ORM**, que é a camada de abstração sobre o SQLite. O tipo nativo SQLite correspondente é indicado entre parênteses quando relevante.

## Tabela: `User` (Usuários)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador único, auto-incrementado |
| `email` | `EmailField` (TEXT) | Não | Única | E-mail de acesso |
| `password` | `CharField` (TEXT) | Não | - | Senha em hash (bcrypt via Django) |
| `role` | `CharField(max_length=10)` (TEXT) | Não | - | Papel: ADMIN, SELLER, CUSTOMER |
| `first_name` | `CharField(max_length=150)` (TEXT) | Sim | - | Nome |
| `last_name` | `CharField(max_length=150)` (TEXT) | Sim | - | Sobrenome |
| `phone` | `CharField(max_length=20)` (TEXT) | Sim | - | Telefone de contato |

## Tabela: `Store` (Lojas)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador da Loja (Tenant ID) |
| `owner_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Lojista responsável |
| `name` | `CharField(max_length=255)` (TEXT) | Não | - | Nome fantasia da loja |
| `cnpj` | `CharField(max_length=18)` (TEXT) | Não | Única | CNPJ (formato XX.XXX.XXX/XXXX-XX) |
| `status` | `CharField(max_length=10)` (TEXT) | Não | - | PENDING, ACTIVE, BLOCKED |
| `logo_url` | `URLField` (TEXT) | Sim | - | URL da logo da loja |

## Tabela: `Brand` (Marcas)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador da Marca |
| `name` | `CharField(max_length=255)` (TEXT) | Não | Única | Nome da Marca (Ex: Dior) |

## Tabela: `Product` (Catálogo Global)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do Produto |
| `brand_id` | `BigIntegerField` (INTEGER) | Não | FK(Brand) | Marca do perfume |
| `name` | `CharField(max_length=255)` (TEXT) | Não | - | Nome do Perfume |
| `description` | `TextField` (TEXT) | Sim | - | Descrição rica |
| `olfactory_family` | `CharField(max_length=100)` (TEXT) | Sim | - | Família (Amadeirado, Cítrico, etc) |
| `top_notes` | `JSONField` (TEXT — JSON Array) | Sim | - | Notas de Saída (Cabeça). Ex: `["Bergamota", "Limão"]` |
| `heart_notes` | `JSONField` (TEXT — JSON Array) | Sim | - | Notas de Corpo (Coração). Ex: `["Jasmim", "Rosa"]` |
| `base_notes` | `JSONField` (TEXT — JSON Array) | Sim | - | Notas de Fundo (Base). Ex: `["Baunilha", "Patchouli"]` |
| `image_url` | `URLField` (TEXT) | Sim | - | Foto oficial do produto |

## Tabela: `StoreProduct` (Estoque/Catálogo da Loja)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do vínculo |
| `store_id` | `BigIntegerField` (INTEGER) | Não | FK(Store) | Loja |
| `product_id` | `BigIntegerField` (INTEGER) | Não | FK(Product) | Produto do catálogo global |
| `price` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Preço de venda praticado pela loja |
| `stock` | `PositiveIntegerField` (INTEGER) | Não | - | Quantidade em estoque (≥ 0) |
| `is_active` | `BooleanField` (INTEGER 0/1) | Não | - | Se está visível na vitrine da loja |

## Tabela: `Order` (Pedidos)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do Pedido |
| `store_id` | `BigIntegerField` (INTEGER) | Não | FK(Store) | Loja que vai atender o pedido |
| `customer_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Cliente que comprou |
| `status` | `CharField(max_length=15)` (TEXT) | Não | - | PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELED |
| `total_amount` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Valor total do pedido (produtos + frete) |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data/hora da compra, preenchida automaticamente |

## Tabela: `OrderItem` (Itens do Pedido)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do item |
| `order_id` | `BigIntegerField` (INTEGER) | Não | FK(Order) | Pedido ao qual pertence |
| `store_product_id` | `BigIntegerField` (INTEGER) | Não | FK(StoreProduct) | Produto específico da loja (snapshot de vínculo) |
| `quantity` | `PositiveIntegerField` (INTEGER) | Não | - | Quantidade comprada (≥ 1) |
| `unit_price` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Preço unitário no momento da compra (snapshot imutável) |
