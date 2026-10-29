# ServiCore — Plataforma de Gestão para Prestadores de Serviços

O **ServiCore** é uma plataforma web moderna concebida para centralizar a gestão operacional e financeira de profissionais autônomos, freelancers e pequenas empresas prestadoras de serviços. O sistema elimina o uso de planilhas dispersas e ferramentas desconectadas, unindo clientes, contratos, tarefas, agenda e movimentações financeiras em um único fluxo intuitivo.

---

## 🏛️ Arquitetura e Decisões Técnicas

### Backend (.NET 8 — Monólito Modular)
- **`ServiCore.Domain`**: Entidades centrais (`User`, `Workspace`, `Membership`, `Customer`, `Contract`, `TaskItem`, `CalendarEvent`, `Receivable`, `Payment`, `Expense`, `AuditLog`), regras de negócio e Value Object `Money` (armazenamento estrito de valores em centavos `long` para evitar imprecisões decimais).
- **`ServiCore.Application`**: Casos de uso, interfaces de abstração (`IAppDbContext`, `ICurrentWorkspaceService`, `IAuditService`, `IStorageService`) e DTOs tipados.
- **`ServiCore.Infrastructure`**: Persistência híbrida via Entity Framework Core 8 com suporte automático e transparente a **SQLite** (ambiente local/desenvolvimento) e **PostgreSQL** (produção em nuvem com Neon ou Supabase), serviços de auditoria e geração de JWT.
- **`ServiCore.Api`**: API REST com ASP.NET Core, documentação interativa Swagger/OpenAPI, tratamento global de exceções, headers de segurança e CORS configurável.
- **`ServiCore.Tests`**: 42 testes automatizados com xUnit e testes de integração com SQLite in-memory cobrindo regras de domínio, simulação idempotente de pagamentos e endpoints de agregação do dashboard e auditoria.

### Frontend (React 19 + TypeScript + Vite + Tailwind CSS v4)
- **Design System Nativo em Dark Mode**: Paleta cromática contemporânea (fundo `#090A0F`, cartões `#11131C`, bordas `#1E2332`, texto `#F4F4F5`, destaques `#38BDF8`, `#10B981` e `#EF4444`).
- **Navegação & Roteamento**: React Router com layout responsivo, sidebar retrátil e cabeçalho contextual.
- **Comunicação com API**: TanStack Query (React Query) com cache inteligente, sincronização em tempo real e estados de carregamento, erro e vazio. Suporte dinâmico a `VITE_API_URL` para conexão a APIs remotas.
- **Testes Unitários de UI**: Vitest + React Testing Library + Jest-DOM.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [.NET SDK 8.0](https://dotnet.microsoft.com/download/dotnet/8.0) ou superior
- [Node.js 20+](https://nodejs.org/) e npm 10+
- (Opcional) Docker & Docker Compose

---

### 1. Backend (API & SQLite)

1. Abra um terminal na pasta raiz do repositório:
```bash
cd backend
```

2. Restaure as ferramentas locais (.NET EF):
```bash
dotnet tool restore
```

3. Aplique as migrations ao banco SQLite local:
```bash
dotnet dotnet-ef database update --project src/ServiCore.Infrastructure/ServiCore.Infrastructure.csproj --startup-project src/ServiCore.Api/ServiCore.Api.csproj
```

4. Execute a API:
```bash
dotnet run --project src/ServiCore.Api/ServiCore.Api.csproj --launch-profile http
```
- A API estará disponível em: `http://localhost:5248`
- O Swagger/OpenAPI interativo estará em: `http://localhost:5248/swagger`

---

### 2. Frontend (Vite)

1. Em outro terminal, acesse a pasta `frontend`:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```
- O aplicativo estará acessível no navegador em: `http://localhost:5173`

---

## 🧪 Como Executar os Testes Automatizados

### Testes do Backend (xUnit - 42 testes)
```bash
dotnet test backend/tests/ServiCore.Tests/ServiCore.Tests.csproj
```
Valida regras de domínio (Value Object `Money`, contas a receber, simulação de pagamentos com chave de idempotência, limites operacionais, agregação do dashboard executivo e filtragem de auditoria).

### Testes do Frontend (Vitest - 6 testes)
```bash
cd frontend
npm test
```
Executa os testes de formatação monetária, estados visuais e comportamento de componentes com Vitest e Testing Library.

---

## 🔐 Credenciais de Demonstração (Seed Inicial)
- **E-mail:** `demo@servicore.com.br`
- **Senha:** `Senha123!`
- **Workspace:** Consultoria & Projetos (Individual)
- **Clientes Iniciais:** Studio Alfa Arquitetura, TechNova Soluções Digitais e Dra. Camila Nogueira.

---

## ☁️ Etapa 6 — Deploy e Produção em Nuvem (Como Tornar Online Todo o Projeto)

O ServiCore foi projetado com arquitetura de contêineres e desacoplamento de banco de dados, permitindo colocá-lo no ar tanto em plataformas gratuitas/PaaS (Vercel + Render + Neon) quanto em VPS própria com Docker Compose.

---

### Opção A: Deploy Gratuito em Nuvem (Recomendado)

Essa topologia distribui o projeto entre serviços especializados com camada gratuita:
- **Banco de Dados:** Neon Serverless PostgreSQL (ou Supabase)
- **Backend API:** Render.com (ou Railway / Fly.io)
- **Frontend SPA:** Vercel (ou Cloudflare Pages)

```
[ Usuário no Navegador ]
         │
         ▼
┌────────────────────────┐      Chamadas REST       ┌────────────────────────┐
│  Vercel / Cloudflare   │ ───────────────────────► │  Render / Railway      │
│  React 19 (Vite SPA)   │    (Bearer JWT Token)    │  .NET 8 Web API        │
└────────────────────────┘                          └───────────┬────────────┘
                                                                │
                                                        Conexão TLS/SSL
                                                                ▼
                                                    ┌────────────────────────┐
                                                    │  Neon PostgreSQL       │
                                                    │  (Serverless DB)       │
                                                    └────────────────────────┘
```

#### Passo 1: Criar o Banco no Neon PostgreSQL
1. Crie uma conta gratuita em [neon.tech](https://neon.tech) e crie um novo projeto (ex: `servicore-prod`).
2. Obtenha a Connection String no painel do Neon. Ela terá o formato:
   ```text
   postgres://[user]:[password]@[ep-xyz].us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   Ou no formato .NET padrão:
   ```text
   Host=ep-xyz.us-east-2.aws.neon.tech;Database=neondb;Username=[user];Password=[password];SSL Mode=Require;Trust Server Certificate=true;
   ```
3. O `DependencyInjection.cs` da Infrastructure detecta automaticamente a presença de `Host=` ou `postgres://` na connection string e chaveia transparentemente para o driver **Npgsql PostgreSQL**.

4. Aplique as migrations diretamente no banco Neon a partir da sua máquina:
   ```bash
   cd backend
   dotnet dotnet-ef database update \
     --project src/ServiCore.Infrastructure/ServiCore.Infrastructure.csproj \
     --startup-project src/ServiCore.Api/ServiCore.Api.csproj \
     --connection "Host=ep-xyz.us-east-2.aws.neon.tech;Database=neondb;Username=SEU_USER;Password=SUA_SENHA;SSL Mode=Require;Trust Server Certificate=true;"
   ```

#### Passo 2: Hospedar o Backend no Render (ou Railway / Fly.io)
1. Crie um Web Service no [Render](https://render.com) conectado ao repositório GitHub do projeto.
2. Defina os parâmetros:
   - **Environment:** `Docker`
   - **Docker Context Path:** `./backend`
   - **DockerfilePath:** `./backend/Dockerfile`
   - **Instance Type:** `Free`
3. Configure as **Environment Variables** no painel do Render:
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `ConnectionStrings__DefaultConnection`: `Host=ep-xyz.us-east-2.aws.neon.tech;Database=neondb;Username=SEU_USER;Password=SUA_SENHA;SSL Mode=Require;Trust Server Certificate=true;`
   - `Jwt__SecretKey`: `SuaChaveSecretaDePeloMenos32CaracteresDeComprimento12345!`
   - `Jwt__Issuer`: `ServiCore.Api`
   - `Jwt__Audience`: `ServiCore.App`
   - `Jwt__ExpirationMinutes`: `1440`
   - `Cors__AllowedOrigins`: `https://seu-app.vercel.app` (substitua pela URL do frontend no Vercel)
4. No campo **Health Check Path**, configure: `/api/v1/health/system`
5. O Render construirá a imagem Docker multi-stage otimizada e publicará sua API (ex: `https://servicore-api.onrender.com`).

#### Passo 3: Hospedar o Frontend no Vercel
1. Conecte o repositório no [Vercel](https://vercel.com).
2. Configure as opções de Build:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Adicione a **Environment Variable**:
   - `VITE_API_URL`: `https://servicore-api.onrender.com` (URL do seu backend no Render, sem barra no final)
4. Clique em **Deploy**. O Vercel gerará a build do React com rota SPA e distribuirá em CDN global de altíssima performance.

---

### Opção B: Deploy Unificado com Docker Compose (VPS Própria)

Para quem deseja hospedar tudo em uma VPS única (DigitalOcean Droplet, Hetzner, AWS Lightsail, Linode):

1. Clone o repositório na sua VPS Linux:
   ```bash
   git clone https://github.com/seu-usuario/ServiCore.git
   cd ServiCore
   ```

2. Revise as credenciais e variáveis no arquivo [`docker-compose.yml`](file:///c:/Users/caio7/OneDrive/Área%20de%20Trabalho/ERP%20de%20Servico/docker-compose.yml):
   - Altere `POSTGRES_PASSWORD` e `Jwt__SecretKey` para senhas seguras de produção.
   - Configure o IP ou domínio da máquina.

3. Inicie todos os serviços com um único comando:
   ```bash
   docker-compose up -d --build
   ```

4. Verifique a integridade dos contêineres:
   ```bash
   docker-compose ps
   ```
   - `servicore_postgres`: banco relacional na porta `5432`
   - `servicore_api`: API .NET na porta `5248`
   - `servicore_web`: Frontend Nginx na porta `3000`

5. (Opcional) Configure um proxy reverso Nginx com SSL gratuito (Let's Encrypt / Certbot) apontando para a porta 3000 (frontend) e encaminhando `/api` para a porta 5248 (backend).

---

## 🗺️ Roadmap de Implementação

- [x] **Etapa 1 — Fundação**: Solução .NET, projetos, EF Core SQLite, migrations, layout base responsivo, dark mode, design tokens, dashboard demonstrativo conectado ao backend e suíte de testes.
- [x] **Etapa 2 — Identidade e Clientes**: Autenticação segura JWT, PBKDF2 hashing, multitenancy por workspace com isolamento estrito via Global Query Filter, CRUD completo de clientes PF/PJ com máscaras de CPF/CNPJ, gaveta de detalhes 360º, auditoria e 17 testes automatizados.
- [x] **Etapa 3 — Contratos e Operação**: Gestão de contratos (fixo, hora, recorrente com itens e cálculos em centavos), catálogo de serviços, quadro Kanban e lista de tarefas com prazos e prioridades, calendário interativo mensal com eventos operacionais e abstração de storage para migração futura ao PostgreSQL Neon.
- [x] **Etapa 4 — Financeiro**: Módulo financeiro completo com contas a receber (faturamento em centavos, parcelamento 1x a 12x), liquidações parciais e totais com auditoria de pagamentos, gestão de despesas operacionais por categoria, dashboard de fluxo de caixa real e projetado com extrato cronológico e simulador de pagamentos idempotente com prevenção estrita a débitos duplicados via `Idempotency-Key`.
- [x] **Etapa 5 — Finalização**: Dashboard executivo em tempo real consolidado via `/api/v1/dashboard/overview`, trilha de auditoria e segurança operacional (`/api/v1/audit-logs`), feed de eventos imutáveis com filtros por entidade em Configurações, botões de ação rápida de cobrança via Pix e WhatsApp integrado e 42 testes automatizados no backend e 6 testes no frontend.
- [x] **Etapa 6 — Deploy e Produção em Nuvem**: Infraestrutura pronta para produção com `backend/Dockerfile` multi-stage .NET 8, `frontend/Dockerfile` com Nginx SPA, `docker-compose.yml` com PostgreSQL 16 integrado, suporte a Neon Serverless PostgreSQL com chaveamento automático via Npgsql, guia completo de deploy passo a passo na nuvem (Neon + Render + Vercel) e em VPS própria.
