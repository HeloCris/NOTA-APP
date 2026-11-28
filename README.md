<div align="center">

<br/>

<!-- Logo / Banner -->
<img src="documentacoes/assets/banner.png" alt="NŌTA — Your Scent, Understood." width="100%"/>

<br/><br/>

> *Ecossistema integrado de perfumaria fina e decanteria inteligente: recomendação olfativa, e-commerce B2C e portal de gestão B2B para lojistas e marcas de fragrâncias.*

<br/>

---

### ✦ &nbsp; O Seu Aroma, Compreendido &nbsp; ✦

---

<br/>

<!-- Badges -->
![Status](https://img.shields.io/badge/Status-Finalizado%20%2F%20Homologado-22c55e?style=for-the-badge&logo=checkmarx&logoColor=white)
![Plataforma](https://img.shields.io/badge/Plataforma-Mobile%20%26%20Web-1a1a1a?style=for-the-badge)
![Modelo](https://img.shields.io/badge/Modelo-B2B%20%2F%20B2C-c9a96e?style=for-the-badge)
![Testes](https://img.shields.io/badge/Testes%20Unitários-300%2B%20Passando-38bdf8?style=for-the-badge)

<br/>

</div>

---

<br/>

## 🗂 Sumário

<br/>

<div align="center">

| # | Seção | Descrição |
|:-:|:------|:----------|
| [01](#-sobre-o-projeto) | **Sobre o Projeto** | Visão do produto, problema real e solução integrada |
| [02](#-arquitetura--tecnologias) | **Arquitetura & Stack** | Estrutura técnica, APIs e testes automatizados |
| [03](#-como-executar) | **Como Executar** | Instruções de inicialização do Backend, Web e Mobile |
| [04](#-equipe) | **Equipe** | Integrantes responsáveis pelo desenvolvimento |

</div>

<br/>

---

<br/>

## 01 · Sobre o Projeto

<br/>

<div align="center">
<img src="documentacoes/assets/logo.png" alt="NŌTA Logo" width="380"/>
<br/><br/>
</div>

O **NŌTA** é uma plataforma multicanal especializada no universo da alta perfumaria e decants. O ecossistema conecta entusiastas de fragrâncias, lojistas especializados (boutiques e decanterias) e marcas oficiais (D2C) em uma experiência fluida, técnica e sensorial.

Diferente de um e-commerce genérico, o NŌTA entende a **pirâmide olfativa** de cada criação (notas de topo, coração e base), permitindo que o consumidor descubra fragrâncias compatíveis com seu gosto pessoal e adquira tanto **frascos lacrados** quanto **amostras e decants oficiais (2ml, 5ml e 10ml)** sem o risco financeiro de uma compra às cegas (*blind buy*).

<br/>

### 🎯 O Problema

<br/>

<table>
<tr>
<td width="50%" valign="top">

**Para o Consumidor (B2C)**
- O alto custo de perfumes importados e de nicho torna as compras no escuro arriscadas.
- Falta de ferramentas confiáveis que cruzem notas olfativas preferidas com produtos do mercado.
- Dificuldade em encontrar decants autênticos e lojas verificadas com frete acessível e avaliações transparentes.

</td>
<td width="50%" valign="top">

**Para Lojistas & Marcas (B2B)**
- Ausência de canais especializados para catalogar e precificar decants e frações fracionadas.
- Pouca visibilidade sobre as famílias e notas olfativas mais buscadas pelo público de cada região.
- Canais de atendimento e pós-venda dispersos, sem rastreio de logística, devoluções e resposta pública a avaliações.

</td>
</tr>
</table>

<br/>

### 💡 A Solução Integrada

<br/>

<details open>
<summary><strong>📱 Aplicativo Mobile &nbsp;—&nbsp; Experiência B2C do Consumidor</strong></summary>

<br/>

| Recurso | Descrição |
|:---|:---|
| **Perfil Olfativo & Match %** | Mapeamento das famílias favoritas (amadeirado, cítrico, floral, etc.) com cálculo dinâmico de compatibilidade olfativa em tempo real na vitrine. |
| **Exploração Técnica & Notas** | Busca granular por famílias olfativas, notas de topo/coração/base, gênero, concentração e tipo de oferta (Frasco ou Decant). |
| **Decanteria & Compra Segura** | Escolha de volumetrias fracionadas (2ml, 5ml, 10ml) ou frascos completos com cálculo de frete inteligente (PAC / SEDEX) e frete grátis por loja. |
| **Gestão de Pedidos & Devoluções** | Acompanhamento do status de envio com código de rastreio e fluxo transparente de solicitação de devolução com fotos. |
| **Avaliações com Fotos & Réplica** | Sistema de avaliação pós-entrega com notas, comentários, upload de fotos reais e destaque interativo da resposta oficial da loja. |
| **Chat & Notificações In-App** | Chat em tempo real entre comprador e vendedor vinculado ao pedido e notificações instantâneas sobre novidades e pedidos. |

</details>

<br/>

<details open>
<summary><strong>💻 Portal Web &nbsp;—&nbsp; Experiência B2B para Lojistas e Marcas</strong></summary>

<br/>

| Recurso | Descrição |
|:---|:---|
| **Dashboard Operacional 360°** | Painel em tempo real com métricas de receita, total de pedidos, ticket médio, funil de conversão e atalhos rápidos. |
| **Inteligência de Mercado (RF-23 / RF-24)** | Relatórios analíticos de demanda olfativa: notas mais buscadas, famílias em alta, ranking de marcas e taxa de compatibilidade da base de clientes. |
| **Gestão de Estoque & Volumetrias** | Cadastro de ofertas fracionadas (decants) e frascos, controle de estoque unitário, preços promocionais e ativação imediata. |
| **Logística & Despacho de Pedidos** | Fluxo de processamento de pedidos, inserção de código de rastreamento com transportadora e gestão de devoluções. |
| **Central de Cupons Promocionais** | Criação de cupons por loja com definição de desconto, validade, valor mínimo de pedido e limite de usos por usuário. |
| **Onboarding & Homologação D2C** | Área dedicada para casas de perfumaria e marcas oficiais cadastrarem contratos sociais e registros INPI para obtenção do selo de Loja Oficial. |

</details>

<br/>

---

<br/>

## 02 · Arquitetura & Tecnologias

<br/>

```text
┌──────────────────────────┐      ┌──────────────────────────┐
│     Aplicativo Mobile    │      │        Portal Web        │
│ (React Native / Expo 58) │      │ (React 19 / TypeScript)  │
└────────────┬─────────────┘      └────────────┬─────────────┘
             │                                 │
             └───────────────┬─────────────────┘
                             │ HTTP / JSON (JWT Bearer)
                             ▼
              ┌──────────────────────────────┐
              │      Backend API REST        │
              │   (Django 5.2 / DRF 3.16)    │
              └──────────────┬───────────────┘
                             │ Django ORM
                             ▼
              ┌──────────────────────────────┐
              │      Base de Dados Relacional │
              │          (SQLite / PostgreSQL) │
              └──────────────────────────────┘
```

<br/>

### Stack Tecnológica & Qualidade

| Camada | Tecnologias Principais | Testes Automatizados |
|:---|:---|:---:|
| **Backend** | Python 3.13, Django 5.2, Django REST Framework, Simple JWT, SQLite | **193 testes** (`pytest`) |
| **Web** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7 | **53 testes** (`vitest`) |
| **Mobile** | React Native 0.88, Expo 58 (SDK 58), Expo Router, TypeScript | **54 testes** (`jest`) |

<br/>

---

<br/>

## 03 · Como Executar

<br/>

### 1. Pré-requisitos
- Python 3.12+ ou 3.13
- Node.js 20+ e npm
- Git

<br/>

### 2. Backend (API Django)

```bash
# Acessar a pasta e criar ambiente virtual
cd backend
python -m venv venv

# Ativar ambiente virtual
# No Windows:
.\venv\Scripts\activate
# No Linux/Mac:
source venv/bin/activate

# Instalar dependências e aplicar migrações
pip install -r requirements.txt
python manage.py migrate

# Rodar os testes automatizados
pytest

# Iniciar o servidor de desenvolvimento
python manage.py runserver 0.0.0.0:8000
```

<br/>

### 3. Portal Web (React + Vite)

```bash
# Acessar a pasta do frontend web
cd web

# Instalar dependências
npm install

# Rodar a suíte de testes unitários
npm test

# Iniciar o portal web
npm run dev
```

<br/>

### 4. Aplicativo Mobile (Expo / React Native)

```bash
# Acessar a pasta mobile
cd mobile

# Instalar dependências
npm install

# Rodar os testes unitários
npm test

# Iniciar o servidor Expo
npx expo start
```

<br/>

---

<br/>

## 04 · Equipe

<br/>

<div align="center">

*As mentes e mãos por trás do NŌTA.*

<br/>

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/HeloCris">
        <img src="https://github.com/HeloCris.png" width="85" style="border-radius:50%"/><br/><br/>
        <sub><b>Helorrayne Cristine de Alcantara Rodrigues</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/LeticiaGLopes-151">
        <img src="https://github.com/LeticiaGLopes-151.png" width="85" style="border-radius:50%"/><br/><br/>
        <sub><b>Letícia Gomes Lopes</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/luc4sm0ur4">
        <img src="https://github.com/luc4sm0ur4.png" width="85" style="border-radius:50%"/><br/><br/>
        <sub><b>Lucas Carvalho da Luz Moura</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/iohanan-cephas">
        <img src="https://github.com/iohanan-cephas.png" width="85" style="border-radius:50%"/><br/><br/>
        <sub><b>João Pedro Oliveira Barbosa</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/nhangamona">
        <img src="https://github.com/nhangamona.png" width="85" style="border-radius:50%"/><br/><br/>
        <sub><b>Laurinda Nhanga Mona</b></sub>
      </a>
    </td>
  </tr>
</table>

</div>

<br/>

---

<br/>

<div align="center">

<br/>

*NŌTA — Cada nota conta uma história.*

<br/>

<img src="documentacoes/assets/logo-icon.png" alt="NŌTA Icon" width="160"/>

<br/><br/>

![Feito com Amor](https://img.shields.io/badge/Feito%20com-✦%20e%20alta%20perfumaria-c9a96e?style=for-the-badge)

<br/>

</div>
