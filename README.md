# ServiCore — Plataforma de Gestão para Prestadores de Serviços

O **ServiCore** é uma plataforma web moderna concebida para centralizar a gestão operacional e financeira de profissionais autônomos, freelancers e pequenas empresas prestadoras de serviços. O sistema elimina o uso de planilhas dispersas e ferramentas desconectadas, unindo clientes, contratos, tarefas, agenda e movimentações financeiras em um único fluxo intuitivo.

---

## 🏛️ Arquitetura e Decisões Técnicas (Etapa 1 — Fundação)

### Backend (.NET 8 — Monólito Modular)
- **`ServiCore.Domain`**: Entidades centrais (`User`, `Workspace`, `Membership`, `AuditLog`), regras de negócio e Value Object `Money` (armazenamento estrito de valores em centavos `long` para evitar imprecisões decimais).
- **`ServiCore.Application`**: Casos de uso, interfaces de abstração (`IAppDbContext`, `ICurrentWorkspaceService`) e DTOs tipados.
- **`ServiCore.Infrastructure`**: Persistência com Entity Framework Core 8, migrations versionadas para SQLite e serviços de contexto HTTP.
- **`ServiCore.Api`**: API REST com ASP.NET Core, documentação interativa Swagger/OpenAPI, tratamento global de exceções e CORS configurado.
- **`ServiCore.Tests`**: Testes unitários com xUnit e testes de integração com SQLite in-memory.

### Frontend (React 19 + TypeScript + Vite + Tailwind CSS v4)
- **Design System Nativo em Dark Mode**: Paleta cromática contemporânea (fundo `#0B0F14`, superfícies `#111820`, superfícies elevadas `#18212B`, bordas `#273340`, texto `#F1F5F9`, destaque azul-celeste `#38BDF8`).
- **Navegação & Roteamento**: React Router com layout responsivo, sidebar retrátil e cabeçalho contextual.
- **Comunicação com API**: TanStack Query (React Query) com cache inteligente, monitoramento de conectividade em tempo real e estados de carregamento, erro e vazio.
- **Testes Unitários de UI**: Vitest + React Testing Library + Jest-DOM.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [.NET SDK 8.0](https://dotnet.microsoft.com/download/dotnet/8.0) ou superior
- [Node.js 20+](https://nodejs.org/) e npm 10+

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

2. Instale as dependências (caso não tenham sido instaladas):
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

### Testes do Backend (xUnit)
```bash
dotnet test backend/tests/ServiCore.Tests/ServiCore.Tests.csproj
```
Valida regras de domínio (Value Object `Money`, formatação em centavos, normalização de documentos/emails) e persistência de banco de dados SQLite in-memory.

### Testes do Frontend (Vitest)
```bash
cd frontend
npm test
```
Executa os testes de renderização e comportamento dos componentes com Vitest e Testing Library.

---

## 📦 Como Criar Novas Migrations no Banco

Para adicionar novas tabelas ou alterar o esquema do banco de dados SQLite:

```bash
cd backend
dotnet dotnet-ef migrations add NomeDaMigration --project src/ServiCore.Infrastructure/ServiCore.Infrastructure.csproj --startup-project src/ServiCore.Api/ServiCore.Api.csproj --output-dir Persistence/Migrations
dotnet dotnet-ef database update --project src/ServiCore.Infrastructure/ServiCore.Infrastructure.csproj --startup-project src/ServiCore.Api/ServiCore.Api.csproj
```

---

---

## 🔐 Credenciais de Demonstração (Seed Inicial)
- **E-mail:** `demo@servicore.com.br`
- **Senha:** `Senha123!`
- **Workspace:** Consultoria & Projetos (Individual)
- **Clientes Iniciais:** Studio Alfa Arquitetura, TechNova Soluções Digitais e Dra. Camila Nogueira.

---

---

## 🐘 Preparação para Migração: PostgreSQL (Neon Database) e Storage de Arquivos

A Etapa 3 foi desenhada e arquitetada para transição transparente para o **Neon PostgreSQL** e armazenamento de objetos (S3 / Cloudflare R2 / Supabase Storage):

### 1. Desacoplamento de Anexos e Arquivos
- **Abstração `IStorageService`**: A interface `IStorageService` no `ServiCore.Application` define métodos assíncronos para `UploadAsync`, `DownloadAsync`, `DeleteAsync` e `GetSignedUrlAsync`.
- **Implementação Atual (`NullStorageService`)**: No ambiente local com SQLite, o sistema registra `NullStorageService`, gravando apenas metadados (`fileName`, `contentType`, `fileSizeBytes`, `storageKeyOrUrl`) na entidade `ContractAttachment` sem gravar BLOBs pesados ou corromper a base SQLite.
- **Próximo Passo no Neon**: Ao ativar o Neon, basta implementar `S3StorageService` ou `SupabaseStorageService` e registrar no container de DI sem alterar nenhuma regra de domínio ou controller.

### 2. Migração para o Neon Database (PostgreSQL)
Para apontar o backend para sua instância Neon:
1. Adicione o pacote `Npgsql.EntityFrameworkCore.PostgreSQL` ao projeto `ServiCore.Infrastructure`.
2. Em `appsettings.json`, defina a connection string do Neon:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=ep-xyz.us-east-2.aws.neon.tech;Database=neondb;Username=user;Password=pass;SSL Mode=Require;"
   }
   ```
3. No `DependencyInjection.cs` da Infrastructure, troque `.UseSqlite(...)` por `.UseNpgsql(...)`. O domínio já utiliza `long` em centavos para moedas (`amountCents`) e tipos ANSI/UTC compatíveis nativamente com Postgres.

---

## 🗺️ Roadmap de Implementação

- [x] **Etapa 1 — Fundação**: Solução .NET, projetos, EF Core SQLite, migrations, layout base responsivo, dark mode, design tokens, dashboard demonstrativo conectado ao backend e suíte de testes.
- [x] **Etapa 2 — Identidade e Clientes**: Autenticação segura JWT, PBKDF2 hashing, multitenancy por workspace com isolamento estrito via Global Query Filter, CRUD completo de clientes PF/PJ com máscaras de CPF/CNPJ, gaveta de detalhes 360º, auditoria e 17 testes automatizados.
- [x] **Etapa 3 — Contratos e Operação**: Gestão de contratos (fixo, hora, recorrente com itens e cálculos em centavos), catálogo de serviços, quadro Kanban e lista de tarefas com prazos e prioridades, calendário interativo mensal com eventos operacionais e abstração de storage para migração futura ao PostgreSQL Neon.
- [x] **Etapa 4 — Financeiro**: Módulo financeiro completo com contas a receber (faturamento em centavos, parcelamento 1x a 12x), liquidações parciais e totais com auditoria de pagamentos, gestão de despesas operacionais por categoria, dashboard de fluxo de caixa real e projetado com extrato cronológico e simulador de pagamentos idempotente com prevenção estrita a débitos duplicados via `Idempotency-Key`.
- [ ] **Etapa 5 — Finalização**: Dashboard consolidado em tempo real, auditoria completa, acessibilidade e documentação final.
