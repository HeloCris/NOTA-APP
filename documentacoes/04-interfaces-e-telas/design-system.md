# Design System — NŌTA

Este documento define a paleta de cores, tipografia e os princípios visuais que devem ser estritamente aplicados em ambas as frentes do projeto: o App Mobile (Cliente B2C) e o Painel Web (Lojista).

O objetivo é manter a consistência da marca (Olfactory Architecture) através de variáveis CSS no Web e de tokens no React Native (theme.ts).

## 1. Paleta de Cores

As cores da interface evocam a sofisticação da perfumaria de nicho, equilibrando tons orgânicos e contrastes elegantes.

*   **Primary (Marinho):** `#354B5E`
    *   *Uso:* Botões principais, ícones ativos na Tab Bar, tipografia de destaque e headers.
*   **Secondary (Oliva):** `#5C6B4E`
    *   *Uso:* Badges de sucesso, ícones secundários, destaques de famílias olfativas (ex: Fougère/Amadeirado) e selos de verificação.
*   **Tertiary (Terracota):** `#A85A38`
    *   *Uso:* Botões de CTA (Call to Action) alternativos, alertas suaves, ícones de notificação (carrinho) e notas orientais/especiadas.
*   **Neutral (Creme/Off-White):** `#F5F3E9`
    *   *Uso:* Cor de fundo principal (background-color) do aplicativo e do painel, fundos de cards de produto e áreas de descanso visual.

## 2. Tipografia

A tipografia da plataforma divide-se em duas famílias de fontes do Google Fonts, criando uma hierarquia clara entre leitura e destaque.

*   **Headline (Títulos e Destaques):** Plus Jakarta Sans
    *   *Uso:* Nomes dos perfumes, Nomes das lojas, Títulos de seções (H1, H2, H3) e rótulos de botões primários.
    *   *Pesos recomendados:* SemiBold (600), Bold (700) e ExtraBold (800).
*   **Body & Label (Texto Corrido e Rótulos):** Inter
    *   *Uso:* Descrições de produtos, bios das lojas, textos de inputs, valores de preços e componentes menores (chips de notas olfativas).
    *   *Pesos recomendados:* Regular (400) e Medium (500).

## 3. Elementos de Interface (UI Components)

*   **Botões:**
    *   *Primary:* Fundo `#354B5E`, texto branco, bordas arredondadas (pílula).
    *   *Secondary/Outlined:* Fundo transparente, borda `#354B5E` ou `#E6E1D2`, texto colorido.
    *   *Inverted:* Fundo escuro (ex: `#23282D`), texto branco.
*   **Campos de Busca (Search):** Fundo translúcido ou branco sobre o fundo creme, cantos levemente arredondados, ícone de lupa à esquerda.
*   **Ícones e Ações Rápidas:** Formatos circulares com a cor primária ou secundária de fundo, garantindo uma área de toque de no mínimo 44x44px no mobile.
