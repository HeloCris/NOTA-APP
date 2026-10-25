e # Dicionário de Dados

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
| `views_count` | `PositiveIntegerField` (INTEGER) | Não | - | Contador de visualizações da loja (padrão: 0) — RF-17 |
| `followers_count` | `PositiveIntegerField` (INTEGER) | Não | - | Contador de clientes seguidores da loja (padrão: 0) — RF-19 |
| `max_installments` | `PositiveIntegerField` (INTEGER) | Não | - | Parcelas máximas aceitas (1 a 12, padrão: 6) — RF-19 |
| `free_interest_installments` | `PositiveIntegerField` (INTEGER) | Não | - | Parcelas sem juros oferecidas pela loja (padrão: 3) — RF-19 |
| `min_installment_amount` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Valor mínimo de cada parcela (padrão: R$ 30,00) — RF-19 |

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
| `user_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Cliente que comprou (`related_name='orders'`) |
| `status` | `CharField(max_length=20)` (TEXT) | Não | - | `PENDING`, `PAID`, `PROCESSING`, `CANCEL_REQUESTED`, `SHIPPED`, `DELIVERY_DISPUTED`, `DELIVERED`, `CANCELLED`, `REFUNDED` (ver RF-15) |
| `shipping_service` | `CharField(max_length=50)` (TEXT) | Sim | - | Modalidade de frete selecionada (`SEDEX`, `PAC`, `EXPRESS`, `STANDARD`) |
| `shipping_cost` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Custo do frete para esta loja |
| `shipping_address` | `JSONField` (TEXT) | Não | - | Snapshot do endereço de entrega (`cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`). Pode ser alterado pelo cliente até `PROCESSING`, somente na mesma cidade/UF |
| `address_changed` | `BooleanField` (INTEGER 0/1) | Não | - | `True` se o cliente alterou o endereço após a compra (exibe aviso ao lojista). Padrão `False` |
| `tracking_code` | `CharField(max_length=100)` (TEXT) | Sim | - | Código de rastreamento informado pelo lojista após despacho |
| `carrier` | `CharField(max_length=100)` (TEXT) | Sim | - | Transportadora (`Correios`, `Jadlog`, etc.) — usada para montar o link externo de rastreio |
| `total_amount` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Valor total do pedido (subtotal dos itens + frete) |
| `cancel_reason` | `CharField(max_length=30)` (TEXT) | Sim | - | Motivo pré-definido do cancelamento (ver RF-15) |
| `cancel_description` | `TextField` (TEXT) | Sim | - | Texto livre (obrigatório quando o motivo é `OTHER`) |
| `cancel_requested_at` | `DateTimeField` (TEXT ISO 8601) | Sim | - | Data da solicitação de cancelamento em `PROCESSING` (base do prazo de 48h para auto-aprovação) |
| `shipped_at` | `DateTimeField` (TEXT ISO 8601) | Sim | - | Data do despacho (base da auto-confirmação de entrega em 30 dias) |
| `delivered_at` | `DateTimeField` (TEXT ISO 8601) | Sim | - | Data da confirmação de entrega (base dos prazos de contestação e devolução — 7 dias) |
| `delivery_confirmed_by` | `CharField(max_length=10)` (TEXT) | Sim | - | Quem confirmou a entrega: `CUSTOMER`, `SELLER`, `SYSTEM` |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data/hora da compra, preenchida automaticamente |
| `updated_at` | `DateTimeField(auto_now=True)` (TEXT ISO 8601) | Não | - | Data da última atualização |

## Tabela: `OrderItem` (Itens do Pedido)
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do item |
| `order_id` | `BigIntegerField` (INTEGER) | Não | FK(Order) | Pedido ao qual pertence |
| `store_product_id` | `BigIntegerField` (INTEGER) | Não | FK(StoreProduct) | Produto específico da loja (snapshot de vínculo) |
| `quantity` | `PositiveIntegerField` (INTEGER) | Não | - | Quantidade comprada (≥ 1) |
| `unit_price` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Preço unitário no momento da compra (snapshot imutável) |

## Tabela: `OrderStatusHistory` (Histórico / Timeline do Pedido) — RF-15
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do registro |
| `order_id` | `BigIntegerField` (INTEGER) | Não | FK(Order) | Pedido (`related_name='history'`) |
| `from_status` | `CharField(max_length=20)` (TEXT) | Sim | - | Status anterior (`null` na criação) |
| `to_status` | `CharField(max_length=20)` (TEXT) | Não | - | Novo status |
| `actor` | `CharField(max_length=10)` (TEXT) | Não | - | Quem executou: `CUSTOMER`, `SELLER`, `SYSTEM` |
| `actor_user_id` | `BigIntegerField` (INTEGER) | Sim | FK(User) | Usuário que executou (`null` quando `SYSTEM`) |
| `reason` | `CharField(max_length=255)` (TEXT) | Sim | - | Motivo/observação da transição |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data/hora da transição |

## Tabela: `ReturnRequest` (Solicitação de Devolução) — RF-15
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador da devolução |
| `order_id` | `BigIntegerField` (INTEGER) | Não | FK(Order) | Pedido de origem (`related_name='returns'`); deve estar `DELIVERED` há ≤ 7 dias |
| `status` | `CharField(max_length=10)` (TEXT) | Não | - | `REQUESTED`, `APPROVED`, `REJECTED`, `RECEIVED`, `REFUNDED` |
| `reason` | `CharField(max_length=30)` (TEXT) | Não | - | Motivo pré-definido (`GAVE_UP`, `WRONG_PURCHASE`, `WRONG_ADDRESS`, `DAMAGED`, `NOT_AS_DESCRIBED`, `OTHER`) |
| `description` | `TextField` (TEXT) | Sim | - | Texto livre (obrigatório quando `OTHER`) |
| `reject_reason` | `TextField` (TEXT) | Sim | - | Motivo da recusa pelo lojista |
| `return_tracking_code` | `CharField(max_length=100)` (TEXT) | Sim | - | Rastreio do envio de volta (opcional; frete da devolução fora do sistema) |
| `resellable` | `BooleanField` (INTEGER 0/1) | Sim | - | Informado no recebimento; se `True`, o estoque dos itens é devolvido |
| `refund_amount` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Sim | - | Valor reembolsado (soma de `unit_price × quantity` dos itens devolvidos) |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data da solicitação (base do prazo de 48h para auto-aprovação) |
| `updated_at` | `DateTimeField(auto_now=True)` (TEXT ISO 8601) | Não | - | Última atualização |

## Tabela: `ReturnItem` (Itens da Devolução) — RF-15
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador |
| `return_request_id` | `BigIntegerField` (INTEGER) | Não | FK(ReturnRequest) | Devolução (`related_name='items'`) |
| `order_item_id` | `BigIntegerField` (INTEGER) | Não | FK(OrderItem) | Item do pedido devolvido |
| `quantity` | `PositiveIntegerField` (INTEGER) | Não | - | Quantidade devolvida (≥ 1; soma das devoluções não-recusadas ≤ quantidade comprada) |

## Tabela: `ReturnPhoto` (Fotos da Devolução) — RF-15
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador |
| `return_request_id` | `BigIntegerField` (INTEGER) | Não | FK(ReturnRequest) | Devolução (`related_name='photos'`); máximo 3 fotos |
| `image` | `ImageField` (TEXT — caminho) | Não | - | Foto enviada (câmera ou galeria) |

## Tabela: `Review` (Avaliações) — RF-16
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador da avaliação |
| `order_item_id` | `BigIntegerField` (INTEGER) | Não | FK(OrderItem), Única | Item avaliado (1 avaliação por item, mesmo após exclusão) |
| `user_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Autor (exibido como "Nome S.") |
| `store_id` | `BigIntegerField` (INTEGER) | Não | FK(Store) | Loja avaliada (desnormalizado para consultas/médias) |
| `product_id` | `BigIntegerField` (INTEGER) | Não | FK(Product) | Perfume avaliado (agrega todas as volumetrias) |
| `store_product_id` | `BigIntegerField` (INTEGER) | Não | FK(StoreProduct) | Oferta comprada (exibe a volumetria na avaliação) |
| `rating` | `PositiveSmallIntegerField` (INTEGER) | Não | - | Nota de 1 a 5 |
| `comment` | `TextField(max_length=1000)` (TEXT) | Sim | - | Comentário opcional |
| `edited_at` | `DateTimeField` (TEXT ISO 8601) | Sim | - | Preenchido na única edição permitida (exibe "Editada") |
| `is_hidden` | `BooleanField` (INTEGER 0/1) | Não | - | `True` quando o item teve devolução aprovada (não aparece nem conta na média) |
| `is_deleted` | `BooleanField` (INTEGER 0/1) | Não | - | Exclusão lógica pelo cliente |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data da avaliação (até 30 dias após `delivered_at`) |
| `updated_at` | `DateTimeField(auto_now=True)` (TEXT ISO 8601) | Não | - | Última atualização |

## Tabela: `ReviewPhoto` (Fotos da Avaliação) — RF-16
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador |
| `review_id` | `BigIntegerField` (INTEGER) | Não | FK(Review) | Avaliação (`related_name='photos'`); máximo 3 fotos |
| `image` | `ImageField` (TEXT — caminho) | Não | - | Foto (câmera ou galeria) |

## Tabela: `ReviewReply` (Resposta da Loja) — RF-16
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador |
| `review_id` | `BigIntegerField` (INTEGER) | Não | FK(Review), Única | Avaliação respondida (1 resposta por avaliação) |
| `author_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Lojista / Loja Oficial que respondeu |
| `text` | `TextField(max_length=1000)` (TEXT) | Não | - | Resposta pública |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data da resposta |
| `updated_at` | `DateTimeField(auto_now=True)` (TEXT ISO 8601) | Não | - | Última edição da resposta |

## Tabela: `ChatConversation` (Conversas / Chat) — RF-18
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador da conversa |
| `customer_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Cliente participante da conversa |
| `store_id` | `BigIntegerField` (INTEGER) | Não | FK(Store) | Loja participante |
| `order_id` | `BigIntegerField` (INTEGER) | Sim | FK(Order) | Pedido vinculado opcional para suporte contextual |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Criação da conversa |
| `updated_at` | `DateTimeField(auto_now=True)` (TEXT ISO 8601) | Não | - | Data da última mensagem |

## Tabela: `ChatMessage` (Mensagens do Chat) — RF-18
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador da mensagem |
| `conversation_id` | `BigIntegerField` (INTEGER) | Não | FK(ChatConversation) | Conversa pai (`related_name='messages'`) |
| `sender_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Usuário remetente |
| `text` | `TextField(max_length=1500)` (TEXT) | Sim | - | Conteúdo da mensagem (obrigatório se sem foto) |
| `attachment_image` | `ImageField` (TEXT — caminho) | Sim | - | Foto anexada opcional |
| `is_read` | `BooleanField` (INTEGER 0/1) | Não | - | Se a mensagem foi visualizada pelo destinatário |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data e hora de envio |

## Tabela: `Notification` (Central de Notificações) — RF-18
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador da notificação |
| `user_id` | `BigIntegerField` (INTEGER) | Sim | FK(User) | Destinatário usuário (cliente ou lojista) |
| `store_id` | `BigIntegerField` (INTEGER) | Sim | FK(Store) | Loja destinatária quando evento operacional de tenant |
| `title` | `CharField(max_length=150)` (TEXT) | Não | - | Título resumido do alerta |
| `message` | `TextField` (TEXT) | Não | - | Detalhe textual da notificação |
| `type` | `CharField(max_length=30)` (TEXT) | Não | - | Tipo: `NEW_ORDER`, `NEW_MESSAGE`, `CANCEL_REQUEST`, `RETURN_REQUEST`, `NEW_REVIEW`, `LOW_STOCK`, `ORDER_SHIPPED`, `ORDER_DELIVERED` |
| `target_url` | `CharField(max_length=255)` (TEXT) | Sim | - | Rota interna para navegação ao clicar no alerta |
| `is_read` | `BooleanField` (INTEGER 0/1) | Não | - | Se a notificação foi marcada como lida |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data/hora do disparo |

## Tabela: `StoreCoupon` (Cupons da Loja) — RF-19
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador do cupom |
| `store_id` | `BigIntegerField` (INTEGER) | Não | FK(Store) | Loja emitente do cupom |
| `code` | `CharField(max_length=30)` (TEXT) | Não | - | Código promocional (ex: `BEMVINDO10`) |
| `discount_type` | `CharField(max_length=15)` (TEXT) | Não | - | `PERCENTAGE` ou `FIXED_VALUE` |
| `discount_value` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Não | - | Valor do desconto (% ou R$) |
| `min_purchase_amount` | `DecimalField(max_digits=10, decimal_places=2)` (NUMERIC) | Sim | - | Subtotal mínimo da loja para validar o cupom |
| `usage_limit` | `PositiveIntegerField` (INTEGER) | Sim | - | Limite máximo global de utilizações |
| `used_count` | `PositiveIntegerField` (INTEGER) | Não | - | Contador de utilizações concluídas |
| `valid_until` | `DateTimeField` (TEXT ISO 8601) | Sim | - | Data e hora de expiração |
| `is_active` | `BooleanField` (INTEGER 0/1) | Não | - | Status de ativação pelo lojista |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data de criação |

## Tabela: `StoreFollower` (Seguidores da Loja) — RF-19
| Nome | Tipo Django ORM (SQLite nativo) | Nullable | Chave | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `BigAutoField` (INTEGER) | Não | PK | Identificador |
| `store_id` | `BigIntegerField` (INTEGER) | Não | FK(Store) | Loja seguida |
| `user_id` | `BigIntegerField` (INTEGER) | Não | FK(User) | Consumidor seguidor |
| `created_at` | `DateTimeField(auto_now_add=True)` (TEXT ISO 8601) | Não | - | Data em que passou a seguir |
