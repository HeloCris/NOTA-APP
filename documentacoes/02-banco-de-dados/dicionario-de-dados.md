# Dicionário de Dados

Especificação das principais tabelas e campos do banco de dados. Os tipos de dado listados seguem a notação do **Django ORM**, que é a camada de abstração sobre o SQLite. O tipo nativo SQLite correspondente é indicado entre parênteses quando relevante.

## Tabela: `User` (Usuários)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador único, auto-incrementado |
| `email` | `EmailField` (TEXT) | Não | Única | E-mail de acesso |
| `password` | `CharField` (TEXT) | Não | - | Senha em hash (bcrypt via Django) |
| `role` | `CharField(max_length=15)` (TEXT) | Não | - | Papel: `ADMIN`, `SELLER`, `CUSTOMER`, `BRAND_OWNER` |
| `first_name` | `CharField(max_length=150)` (TEXT) | Sim | - | Nome |
| `last_name` | `CharField(max_length=150)` (TEXT) | Sim | - | Sobrenome |
| `phone` | `CharField(max_length=20)` (TEXT) | Sim | - | Telefone de contato |

## Tabela: `UserAddress` (Endereços Salvos do Usuário)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do endereço |
| `user_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Usuário proprietário do endereço |
| `tag` | `CharField(max_length=50)` (TEXT) | Não | - | Rótulo/identificador (`Casa`, `Trabalho`, `Principal`, etc.) |
| `recipient_name` | `CharField(max_length=150)` (TEXT) | Sim | - | Nome do destinatário da entrega |
| `street` | `CharField(max_length=255)` (TEXT) | Não | - | Logradouro / Rua / Avenida |
| `number` | `CharField(max_length=20)` (TEXT) | Não | - | Número do imóvel |
| `complement` | `CharField(max_length=100)` (TEXT) | Sim | - | Complemento (Apto, Bloco, etc.) |
| `neighborhood` | `CharField(max_length=100)` (TEXT) | Não | - | Bairro |
| `city` | `CharField(max_length=100)` (TEXT) | Não | - | Cidade |
| `state` | `CharField(max_length=2)` (TEXT) | Não | - | UF (ex: `GO`, `SP`, `RJ`) |
| `postal_code` | `CharField(max_length=9)` (TEXT) | Não | - | CEP no formato 00000-000 |
| `phone` | `CharField(max_length=30)` (TEXT) | Sim | - | Telefone do destinatário |
| `is_default` | `BooleanField` (INTEGER 0/1) | Não | - | Se `True`, é o endereço padrão carregado no checkout |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data de cadastro |
| `updated_at` | `DateTimeField(auto_now=True)` (TEXT ISO 8601) | Não | - | Data da última atualização |

## Tabela: `Store` (Lojas)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador da Loja (Tenant ID) |
| `owner_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Lojista responsável |
| `name` | `CharField(max_length=255)` (TEXT) | Não | - | Nome fantasia da loja |
| `cnpj` | `CharField(max_length=18)` (TEXT) | Não | Única | CNPJ (formato XX.XXX.XXX/XXXX-XX) |
| `status` | `CharField(max_length=10)` (TEXT) | Não | - | PENDING, ACTIVE, BLOCKED |
| `logo_url` | `URLField` (TEXT) | Sim | - | URL da logo da loja |
| `shipping_local_pac` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Sim | - | Valor do frete PAC para o mesmo Estado (UF) de origem |
| `shipping_local_sedex` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Sim | - | Valor do frete SEDEX para o mesmo Estado (UF) de origem |
| `shipping_pac_price` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Sim | - | Valor do frete PAC nacional (outros estados) |
| `shipping_sedex_price` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Sim | - | Valor do frete SEDEX nacional (outros estados) |
| `shipping_handling_days` | `PositiveIntegerField` (INTEGER) | Não | - | Dias úteis de preparação/manuseio antes do despacho (padrão: 1) |
| `free_shipping_threshold` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Sim | - | Valor mínimo de pedido para frete grátis (opcional) |

## Tabela: `Brand` (Marcas)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador da Marca |
| `name` | `CharField(max_length=255)` (TEXT) | Não | Única | Nome da Marca (Ex: Dior) |
| `owner_id` | `BigIntegerField` (INTEGER) | Sim | FK(User) | `BRAND_OWNER` responsável pela marca; `null` para marcas do catálogo base |
| `cnpj` | `CharField(max_length=14)` (TEXT) | Sim | Única | CNPJ da marca (só dígitos); obrigatório no Brand Onboarding |
| `inpi_registration` | `CharField(max_length=50)` (TEXT) | Sim | - | Número de registro no INPI; obrigatório no Brand Onboarding |
| `status` | `CharField(max_length=10)` (TEXT) | Não | - | `PENDING`, `APPROVED`, `REJECTED` |
| `is_official` | `BooleanField` (INTEGER 0/1) | Não | - | Se `True`, exibe selo "Marca Oficial" na plataforma |
| `d2c_store_id` | `BigIntegerField` (INTEGER) | Sim | FK(Store) | Loja Oficial gerada ao ativar o modelo D2C; `null` se D2C inativo |

## Tabela: `Product` (Catálogo Global)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do Produto |
| `brand_id` | `BigIntegerField` (INTEGER) | Não | FK(Brand) | Marca do perfume |
| `name` | `CharField(max_length=255)` (TEXT) | Não | - | Nome do Perfume |
| `ean` | `CharField(max_length=13)` (TEXT) | Não | Única | Código EAN-13 (GTIN/Código de Barras); obrigatório |
| `anvisa_code` | `CharField(max_length=30)` (TEXT) | Não | Única | Número de Processo da Anvisa; obrigatório |
| `concentration` | `CharField(max_length=30)` (TEXT) | Não | - | Concentração do perfume: `Parfum`, `EDP`, `EDT`, `EDC`, `Eau Fraîche` |
| `gender` | `CharField(max_length=30)` (TEXT) | Não | - | Classificação do perfume: `Masculino`, `Feminino`, `Compartilhável` |
| `description` | `TextField` (TEXT) | Sim | - | Descrição rica |
| `olfactory_family` | `CharField(max_length=100)` (TEXT) | Não | - | Família (Amadeirado, Cítrico, etc) |
| `top_notes` | `JSONField` (TEXT — JSON Array) | Não | - | Notas de Saída (Cabeça). Ex: `["Bergamota", "Limão"]` |
| `heart_notes` | `JSONField` (TEXT — JSON Array) | Não | - | Notas de Corpo (Coração). Ex: `["Jasmim", "Rosa"]` |
| `base_notes` | `JSONField` (TEXT — JSON Array) | Não | - | Notas de Fundo (Base). Ex: `["Baunilha", "Patchouli"]` |
| `image_url` | `URLField` (TEXT) | Sim | - | Foto oficial do produto |
| `is_approved` | `BooleanField` (INTEGER 0/1) | Não | - | Aprovado pelo Admin ou `BRAND_OWNER` da marca. Somente aprovados aparecem na vitrine |

## Tabela: `StoreProduct` (Estoque/Catálogo da Loja)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do vínculo |
| `store_id` | `BigIntegerField` (INTEGER) | Não | FK(Store) | Loja (lojista comum ou Loja Oficial D2C) |
| `product_id` | `BigIntegerField` (INTEGER) | Não | FK(Product) | Produto do catálogo global |
| `volume_ml` | `PositiveIntegerField` (INTEGER) | Não | Composta | Volume do frasco/decant (≤15ml = Decant; 5, 10, 15, 30, 50, 100, etc.) |
| `price` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Preço de venda praticado pela loja |
| `promotional_price` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Sim | - | Preço promocional (opcional) |
| `stock_quantity` | `PositiveIntegerField` (INTEGER) | Não | - | Quantidade em estoque (≥ 0) |
| `is_available` | `BooleanField` (INTEGER 0/1) | Não | - | Se está visível e disponível para venda |

## Tabela: `Order` (Pedidos)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do Pedido |
| `store_id` | `BigIntegerField` (INTEGER) | Não | FK(Store) | Loja que vai atender o pedido |
| `customer_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Cliente que comprou |
| `status` | `CharField(max_length=15)` (TEXT) | Não | - | PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELED |
| `shipping_service` | `CharField(max_length=50)` (TEXT) | Não | - | Modalidade de frete selecionada (`SEDEX`, `PAC`, `EXPRESS`, `STANDARD`) |
| `shipping_cost` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Custo do frete para esta loja |
| `shipping_address` | `JSONField` (TEXT) | Não | - | Snapshot do endereço de entrega (`cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`) |
| `tracking_code` | `CharField(max_length=100)` (TEXT) | Sim | - | Código de rastreamento informado pelo lojista após despacho |
| `total_amount` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Valor total do pedido (subtotal dos itens + frete) |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data/hora da compra, preenchida automaticamente |

## Tabela: `OrderItem` (Itens do Pedido)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do item |
| `order_id` | `BigIntegerField` (INTEGER) | Não | FK(Order) | Pedido ao qual pertence |
| `store_product_id` | `BigIntegerField` (INTEGER) | Não | FK(StoreProduct) | Produto específico da loja (snapshot de vínculo) |
| `quantity` | `PositiveIntegerField` (INTEGER) | Não | - | Quantidade comprada (≥ 1) |
| `unit_price` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Preço unitário no momento da compra (snapshot imutável) |
