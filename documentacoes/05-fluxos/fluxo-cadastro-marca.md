# Fluxo de Cadastro de Marca (Brand Onboarding)

O fluxo de Onboarding de Marcas é desenhado para ser uma experiência sem fricções (seamless). Como as marcas D2C em nossa plataforma exigem que exista um proprietário (uma conta de usuário real) para gerenciá-la, precisamos criar esse usuário no banco de dados e atrelá-lo à marca recém-criada.

Para evitar redirecionamentos que quebrem a experiência, o formulário da marca centraliza tudo. 

## Passo a Passo no Frontend (UI)

1. **Passo 1: Dados da Marca & Conta**
   O usuário preenche o nome da marca, o próprio nome, e-mail, telefone e **senha**. 
   *Nota:* O e-mail e a senha informados aqui serão as credenciais de acesso da pessoa à plataforma.

2. **Passo 2: Dados Legais**
   O usuário preenche CNPJ, Código INPI (Registro) e seleciona o tipo de negócio.

3. **Passo 3: Documentos**
   O usuário anexa arquivos comprobatórios (PDF, Imagens) em relação ao contrato social e INPI.
   Ao clicar no botão final **"Cadastrar Marca"**, o sistema realiza toda a orquestração.

## Orquestração (Frontend -> Backend)

No momento do clique em "Cadastrar Marca", o React agrupa todos os dados (pessoais, da marca e arquivos PDF/Imagens) usando `FormData` e envia tudo em uma única requisição:

1. **Endpoint Único** (`POST /api/v1/brands/onboarding/`)
   - O backend recebe a requisição `multipart/form-data`.
   - **Criação do Usuário:** Registra o usuário com `is_active=False` (Inativo), impedindo que ele faça login na plataforma.
   - **Criação da Marca:** Salva os dados e documentos da marca, vinculando-a ao usuário criado, com status `PENDING`.
   - **Sem Login Automático:** Diferente do fluxo de clientes comuns, o sistema **NÃO** faz login automático. 

2. **Tela de Acompanhamento (Passo 4)**
   O usuário é direcionado para a tela de Sucesso informando que os dados estão em análise (prazo de ~5 dias úteis).

## Processo de Aprovação (Backend / Admin)

Como a conta está inativa e a marca pendente, a loja D2C não existe. Para aprovar:

1. O Administrador acessa o Painel Django (`/admin`).
2. Entra em **Catalog > Brands**, visualiza os dados e baixa os documentos enviados.
3. O Administrador seleciona a marca e utiliza a Action "Aprovar marcas selecionadas" (ou altera o status editando a marca).
4. **Mágica do Backend:**
   - O status da marca muda para `APPROVED` e ela se torna Oficial.
   - O usuário "dono" da marca é ativado (`is_active = True`).
   - O papel (role) do usuário é alterado de `CUSTOMER` para `BRAND_OWNER`.
   - A partir de agora, o dono da marca conseguirá fazer login e acessar o painel de vendas.
