# Dados Iniciais (Seeds / Fixtures) — NŌTA

Este documento especifica a carga inicial de dados para popular o banco SQLite em ambiente de desenvolvimento e testes. O objetivo é garantir um estado funcional do catálogo global desde o primeiro `python manage.py migrate`.

---

## Como Aplicar as Fixtures

As fixtures devem ser salvas em `apps/<modulo>/fixtures/` e aplicadas com:

```bash
# Carrega todas as fixtures em ordem
python manage.py loaddata brands.json olfactory_families.json products.json

# Ou usando o script de seed customizado (recomendado):
python manage.py seed_db
```

> **Recomendação:** Criar um management command `seed_db` em `apps/core/management/commands/seed_db.py` que aplica todas as fixtures na ordem correta e é idempotente (não duplica dados se executado mais de uma vez).

---

## 1. Marcas (`Brand`)

Arquivo: `apps/catalog/fixtures/brands.json`

```json
[
  { "model": "catalog.brand", "pk": 1, "fields": { "name": "Dior" } },
  { "model": "catalog.brand", "pk": 2, "fields": { "name": "Chanel" } },
  { "model": "catalog.brand", "pk": 3, "fields": { "name": "Carolina Herrera" } },
  { "model": "catalog.brand", "pk": 4, "fields": { "name": "Yves Saint Laurent" } },
  { "model": "catalog.brand", "pk": 5, "fields": { "name": "Giorgio Armani" } },
  { "model": "catalog.brand", "pk": 6, "fields": { "name": "Versace" } },
  { "model": "catalog.brand", "pk": 7, "fields": { "name": "Tom Ford" } },
  { "model": "catalog.brand", "pk": 8, "fields": { "name": "Lancôme" } }
]
```

---

## 2. Famílias Olfativas

As famílias olfativas são armazenadas como choices no model `Product` (campo `CharField`). A lista abaixo representa os valores válidos para o campo `olfactory_family`:

| Valor no Banco | Descrição |
| :--- | :--- |
| `Amadeirado` | Perfumes com base em madeiras como cedro, sândalo e patchouli. Quentes e sofisticados. |
| `Cítrico` | Notas frescas de frutas cítricas: bergamota, limão, laranja. Ideais para o dia. |
| `Oriental` | Composições ricas e sensuais com especiarias, âmbar, baunilha e resinas. |
| `Floral` | O maior grupo: rosas, jasmins, peônias e buquês. Femininos e românticos. |
| `Fougère` | Base de lavanda, oakmoss e cumarina. Clássicos e atemporais, geralmente masculinos. |
| `Aquático` | Inspirados no mar e na frescor da água. Marinhos e modernos. |
| `Gourmand` | Notas comestíveis: chocolate, baunilha, caramelo. Doces e aconchegantes. |

---

## 3. Produtos do Catálogo Global (10 Perfumes com Pirâmide Olfativa Completa)

Arquivo: `apps/catalog/fixtures/products.json`

### Perfume 1 — Sauvage (Dior)
```json
{
  "model": "catalog.product", "pk": 1,
  "fields": {
    "brand_id": 1,
    "name": "Sauvage",
    "olfactory_family": "Amadeirado",
    "top_notes": ["Bergamota da Calábria", "Pimenta"],
    "heart_notes": ["Lavanda", "Pimenta Rosa", "Vetiver"],
    "base_notes": ["Ambroxan", "Cedro", "Labdano"],
    "description": "Selvagem e nobre ao mesmo tempo, Sauvage é um Fougère amadeirado de presença marcante.",
    "image_url": "https://cdn.nota.com/products/dior-sauvage.png"
  }
}
```

### Perfume 2 — Chanel N°5 (Chanel)
```json
{
  "model": "catalog.product", "pk": 2,
  "fields": {
    "brand_id": 2,
    "name": "Chanel N°5",
    "olfactory_family": "Floral",
    "top_notes": ["Aldeídos", "Bergamota", "Limão"],
    "heart_notes": ["Rosa de Grasse", "Jasmim", "Ylang-Ylang", "Lírio do Vale"],
    "base_notes": ["Sândalo", "Almíscar", "Âmbar", "Civeta"],
    "description": "O perfume mais icônico da história, um floral aldéico intemporal e sofisticado.",
    "image_url": "https://cdn.nota.com/products/chanel-n5.png"
  }
}
```

### Perfume 3 — Good Girl (Carolina Herrera)
```json
{
  "model": "catalog.product", "pk": 3,
  "fields": {
    "brand_id": 3,
    "name": "Good Girl",
    "olfactory_family": "Oriental",
    "top_notes": ["Amêndoa", "Café"],
    "heart_notes": ["Tuberosa", "Jasmim Sambac", "Rosa"],
    "base_notes": ["Baunilha", "Fava Tonka", "Cacau", "Patchouli"],
    "description": "Dualidade entre o bem e o mal: floral gourmand com fundo quente e envolvente.",
    "image_url": "https://cdn.nota.com/products/ch-good-girl.png"
  }
}
```

### Perfume 4 — Black Opium (Yves Saint Laurent)
```json
{
  "model": "catalog.product", "pk": 4,
  "fields": {
    "brand_id": 4,
    "name": "Black Opium",
    "olfactory_family": "Gourmand",
    "top_notes": ["Pera", "Laranja", "Bergamota"],
    "heart_notes": ["Café", "Flor de Laranjeira", "Jasmim"],
    "base_notes": ["Baunilha", "Patchouli", "Cedro", "Almíscar"],
    "description": "Um gourmand floral intenso, centrado no café e baunilha. Ousado e viciante.",
    "image_url": "https://cdn.nota.com/products/ysl-black-opium.png"
  }
}
```

### Perfume 5 — Acqua di Giò (Giorgio Armani)
```json
{
  "model": "catalog.product", "pk": 5,
  "fields": {
    "brand_id": 5,
    "name": "Acqua di Giò",
    "olfactory_family": "Aquático",
    "top_notes": ["Bergamota", "Limão", "Lima", "Neroli"],
    "heart_notes": ["Mar", "Jasmim", "Calone", "Fresia"],
    "base_notes": ["Cedro", "Patchouli", "Almíscar Branco"],
    "description": "O clássico aquático masculino que captura a essência do Mediterrâneo.",
    "image_url": "https://cdn.nota.com/products/armani-acqua-di-gio.png"
  }
}
```

### Perfume 6 — Eros (Versace)
```json
{
  "model": "catalog.product", "pk": 6,
  "fields": {
    "brand_id": 6,
    "name": "Eros",
    "olfactory_family": "Oriental",
    "top_notes": ["Hortelã", "Maçã Verde", "Limão"],
    "heart_notes": ["Fava Tonka", "Flor de Gerânio", "Ambrosia"],
    "base_notes": ["Baunilha", "Vetiver", "Oakmoss", "Cedro do Atlas"],
    "description": "Inspirado no deus grego do amor, Eros é intenso, vibrante e irresistível.",
    "image_url": "https://cdn.nota.com/products/versace-eros.png"
  }
}
```

### Perfume 7 — Black Orchid (Tom Ford)
```json
{
  "model": "catalog.product", "pk": 7,
  "fields": {
    "brand_id": 7,
    "name": "Black Orchid",
    "olfactory_family": "Oriental",
    "top_notes": ["Trufa", "Frutas Negras", "Ylang-Ylang"],
    "heart_notes": ["Orquídea Negra", "Flor de Lótus", "Especiarias Negras"],
    "base_notes": ["Patchouli", "Baunilha", "Sândalo", "Incenso"],
    "description": "Um oriental floral luxuoso e misterioso, com a orquídea negra como estrela.",
    "image_url": "https://cdn.nota.com/products/tomford-black-orchid.png"
  }
}
```

### Perfume 8 — La Vie Est Belle (Lancôme)
```json
{
  "model": "catalog.product", "pk": 8,
  "fields": {
    "brand_id": 8,
    "name": "La Vie Est Belle",
    "olfactory_family": "Gourmand",
    "top_notes": ["Groselha Preta", "Pera"],
    "heart_notes": ["Íris", "Jasmim", "Flor de Laranjeira"],
    "base_notes": ["Pralinê", "Baunilha", "Patchouli", "Fava Tonka"],
    "description": "A vida é bela: um gourmand floral que celebra a alegria e a feminilidade.",
    "image_url": "https://cdn.nota.com/products/lancome-la-vie-est-belle.png"
  }
}
```

### Perfume 9 — Miss Dior (Dior)
```json
{
  "model": "catalog.product", "pk": 9,
  "fields": {
    "brand_id": 1,
    "name": "Miss Dior",
    "olfactory_family": "Floral",
    "top_notes": ["Sangria", "Pera", "Bergamota"],
    "heart_notes": ["Rosa Damascena", "Peônia", "Rosa de Grasse"],
    "base_notes": ["Almíscar Branco", "Patchouli", "Fava Tonka"],
    "description": "Um buquê de rosas contemporâneo: romântico, leve e inesquecível.",
    "image_url": "https://cdn.nota.com/products/dior-miss-dior.png"
  }
}
```

### Perfume 10 — Libre (Yves Saint Laurent)
```json
{
  "model": "catalog.product", "pk": 10,
  "fields": {
    "brand_id": 4,
    "name": "Libre",
    "olfactory_family": "Floral",
    "top_notes": ["Bergamota da Calábria", "Groselha Preta"],
    "heart_notes": ["Lavanda de Provence", "Flor de Laranjeira Marroquina"],
    "base_notes": ["Almíscar Branco", "Cedro da Virgínia", "Baunilha Bourbon"],
    "description": "A liberdade tem o perfume de Libre: a lavanda encontra a flor de laranjeira numa fusão ousada.",
    "image_url": "https://cdn.nota.com/products/ysl-libre.png"
  }
}
```

---

## 4. Dados de Usuário e Loja para Desenvolvimento

Arquivo: `apps/users/fixtures/dev_users.json`

> ⚠️ **Nunca carregar em produção.** Usar somente para ambiente `DEBUG=True`.

```json
[
  {
    "model": "users.user", "pk": 1,
    "fields": {
      "email": "admin@nota.com",
      "first_name": "Admin",
      "role": "ADMIN",
      "is_staff": true,
      "is_superuser": true,
      "password": "<hash_gerado_pelo_django>"
    }
  },
  {
    "model": "users.user", "pk": 2,
    "fields": {
      "email": "lojista@nota.com",
      "first_name": "Lojista",
      "role": "SELLER",
      "password": "<hash_gerado_pelo_django>"
    }
  },
  {
    "model": "users.user", "pk": 3,
    "fields": {
      "email": "cliente@nota.com",
      "first_name": "João",
      "last_name": "Silva",
      "role": "CUSTOMER",
      "password": "<hash_gerado_pelo_django>"
    }
  },
  {
    "model": "stores.store", "pk": 1,
    "fields": {
      "owner_id": 2,
      "name": "Essência & Arte",
      "cnpj": "12.345.678/0001-99",
      "status": "ACTIVE",
      "logo_url": "https://cdn.nota.com/lojas/essencia-arte.png"
    }
  }
]
```

> **Dica:** Para gerar o hash correto das senhas nas fixtures, use o management command:
> ```bash
> python -c "from django.contrib.auth.hashers import make_password; print(make_password('senha123'))"
> ```

---

## 5. Cobertura dos Filtros de Busca pelos Seeds

A tabela abaixo garante que os seeds cobrem todos os filtros de busca olfativa mapeados na API:

| Filtro | Valores Cobertos pelos Seeds |
| :--- | :--- |
| `olfactory_family` | Amadeirado, Floral, Oriental, Gourmand, Aquático |
| `top_notes` | Bergamota, Pimenta, Aldeídos, Limão, Café, Hortelã, Maçã Verde, Trufa |
| `heart_notes` | Lavanda, Rosa, Jasmim, Café, Tuberosa, Orquídea Negra, Íris |
| `base_notes` | Ambroxan, Cedro, Baunilha, Patchouli, Almíscar, Pralinê, Fava Tonka |
| `brand` | Dior (×2), Chanel, Carolina Herrera, YSL (×2), Armani, Versace, Tom Ford, Lancôme |
