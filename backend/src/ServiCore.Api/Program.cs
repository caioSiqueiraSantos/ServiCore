using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ServiCore.Api.Middlewares;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using ServiCore.Infrastructure;
using ServiCore.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração de Serviços
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .SelectMany(e => e.Value!.Errors.Select(x => string.IsNullOrWhiteSpace(x.ErrorMessage) ? "Valor inválido fornecido." : x.ErrorMessage))
                .ToList();

            var message = errors.Count > 0 ? errors[0] : "Dados de requisição inválidos.";
            var response = ApiResponse<object>.Fail(message, errors);
            return new BadRequestObjectResult(response);
        };
    });
builder.Services.AddEndpointsApiExplorer();

// Configuração de Autenticação JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ServiCore_Super_Secret_Jwt_Security_Key_2026_Development_Key_Min_256_Bits!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ServiCore";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ServiCoreClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

builder.Services.AddAuthorization();

// Configuração do Swagger com suporte a Bearer Token JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ServiCore API",
        Version = "v1",
        Description = "API REST da plataforma de gestão ServiCore para prestadores de serviços, autônomos e freelancers.",
        Contact = new OpenApiContact
        {
            Name = "Equipe de Engenharia ServiCore"
        }
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Insira o token JWT no formato: Bearer {seu_token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configuração de CORS para permitir acesso local do frontend Vite
const string corsPolicyName = "AllowFrontendDev";
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Injeção de Infraestrutura (EF Core com SQLite e Serviços de Autenticação)
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();

// 2. Middleware Pipeline
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ServiCore API v1");
        c.RoutePrefix = "swagger";
    });

    // Em desenvolvimento, garante que o banco SQLite inicial seja atualizado e contenha dados de teste
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ServiCoreDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    try
    {
        db.Database.Migrate();

        if (!db.Users.Any())
        {
            var demoUser = new User("Caio Consultor", "demo@servicore.com.br", hasher.HashPassword("Senha123!"));
            var demoWorkspace = new Workspace("Consultoria & Projetos", WorkspaceType.Individual, "12345678900");
            var demoMembership = new Membership(demoUser.Id, demoWorkspace.Id, MembershipRole.Owner);

            db.Users.Add(demoUser);
            db.Workspaces.Add(demoWorkspace);
            db.Memberships.Add(demoMembership);

            var c1 = new Customer(demoWorkspace.Id, "Studio Alfa Arquitetura", CustomerType.Company, "12345678000190", "contato@alfaarquitetura.com.br", "(11) 99882-1001", "Cliente de consultoria em design de interiores.");
            var c2 = new Customer(demoWorkspace.Id, "TechNova Soluções Digitais", CustomerType.Company, "98765432000110", "financeiro@technova.com.br", "(11) 98774-2002", "Cliente de suporte e infraestrutura de TI.");
            var c3 = new Customer(demoWorkspace.Id, "Dra. Camila Nogueira", CustomerType.Individual, "12345678900", "camila.nogueira@gmail.com", "(21) 97123-4567", "Consultoria de processos e compliance.");

            db.Customers.AddRange(c1, c2, c3);
            db.SaveChanges();
        }

        if (!db.Services.Any() && db.Workspaces.Any())
        {
            var ws = db.Workspaces.First();
            var customers = db.Customers.Where(c => c.WorkspaceId == ws.Id).ToList();

            var s1 = new ServiceItem(ws.Id, "Consultoria Estratégica", new Money(35000), ServiceBillingUnit.Hour, "Sessão de consultoria estratégica e planejamento", 2);
            var s2 = new ServiceItem(ws.Id, "Desenvolvimento Web Fullstack", new Money(18000), ServiceBillingUnit.Hour, "Desenvolvimento e manutenção de aplicações web", 40);
            var s3 = new ServiceItem(ws.Id, "Suporte e Monitoramento Mensal", new Money(250000), ServiceBillingUnit.Month, "Monitoramento proativo e sustentação contínua de TI", 160);
            db.Services.AddRange(s1, s2, s3);
            db.SaveChanges();

            if (customers.Count >= 2 && !db.Contracts.Any())
            {
                var contract1 = new Contract(
                    ws.Id,
                    customers[0].Id,
                    "Reestruturação de Identidade & Plataforma",
                    ContractBillingType.FixedPrice,
                    new Money(1500000),
                    DateTime.UtcNow.AddMonths(-1),
                    DateTime.UtcNow.AddMonths(2),
                    "Redesenho completo da identidade visual e desenvolvimento de novo portal institucional."
                );
                contract1.Activate();
                contract1.Items.Add(new ContractItem(contract1.Id, "Fase 1: Wireframing e Design System", 1, new Money(500000), s1.Id));
                contract1.Items.Add(new ContractItem(contract1.Id, "Fase 2: Implementação Front-end", 1, new Money(1000000), s2.Id));

                var contract2 = new Contract(
                    ws.Id,
                    customers[1].Id,
                    "Sustentação Contínua & Cloud DevOps",
                    ContractBillingType.Recurring,
                    new Money(450000),
                    DateTime.UtcNow.AddMonths(-3),
                    DateTime.UtcNow.AddMonths(9),
                    "Gestão contínua de infraestrutura, deploys e monitoramento de disponibilidade 24/7."
                );
                contract2.Activate();

                db.Contracts.AddRange(contract1, contract2);
                db.SaveChanges();

                var t1 = new TaskItem(ws.Id, "Aprovação do layout com diretoria", TaskPriority.High, "Apresentar protótipo navegável em alta fidelidade.", customers[0].Id, contract1.Id, s1.Id, DateTime.UtcNow.AddDays(3), 120);
                var t2 = new TaskItem(ws.Id, "Configuração de pipeline CI/CD", TaskPriority.Medium, "Configurar GitHub Actions e deploy automatizado.", customers[1].Id, contract2.Id, s2.Id, DateTime.UtcNow.AddDays(7), 180);
                var t3 = new TaskItem(ws.Id, "Reunião de alinhamento de escopo", TaskPriority.Low, "Levantamento de requisitos da próxima sprint.", customers[0].Id, contract1.Id, null, DateTime.UtcNow.AddDays(-2), 60);
                t3.ChangeStatus(TaskItemStatus.Completed);

                db.Tasks.AddRange(t1, t2, t3);

                var ev1 = new CalendarEvent(ws.Id, "Reunião de Sprint Review - Studio Alfa", DateTime.UtcNow.AddDays(1).Date.AddHours(14), DateTime.UtcNow.AddDays(1).Date.AddHours(15).AddMinutes(30), CalendarEventType.Meeting, "Revisão das entregas da semana.", "Google Meet (link via convite)", customers[0].Id, contract1.Id);
                var ev2 = new CalendarEvent(ws.Id, "Entrega do Marco 1 - Design System", DateTime.UtcNow.AddDays(5).Date.AddHours(10), DateTime.UtcNow.AddDays(5).Date.AddHours(11), CalendarEventType.Delivery, "Validação dos componentes e paleta aprovada.", "Presencial no cliente", customers[0].Id, contract1.Id);
                var ev3 = new CalendarEvent(ws.Id, "Check-in Mensal de Infraestrutura - TechNova", DateTime.UtcNow.AddDays(8).Date.AddHours(16), DateTime.UtcNow.AddDays(8).Date.AddHours(17), CalendarEventType.FollowUp, "Apresentação dos relatórios de SLA e uptime.", "Microsoft Teams", customers[1].Id, contract2.Id);

                db.CalendarEvents.AddRange(ev1, ev2, ev3);
                db.SaveChanges();
            }
        }

        if (!db.Receivables.Any() && db.Workspaces.Any())
        {
            var ws = db.Workspaces.First();
            var customers = db.Customers.Where(c => c.WorkspaceId == ws.Id).ToList();
            var contracts = db.Contracts.Where(c => c.WorkspaceId == ws.Id).ToList();

            if (customers.Count >= 3)
            {
                var contract1 = contracts.FirstOrDefault();
                var contract2 = contracts.Skip(1).FirstOrDefault();

                // 1. Conta a Receber Quitada (com baixa Pix total)
                var r1 = new Receivable(
                    ws.Id,
                    customers[0].Id,
                    "Parcela 1/3 - Reestruturação de Identidade",
                    new Money(500000), // R$ 5.000,00
                    DateTime.UtcNow.AddDays(-15),
                    DateTime.UtcNow.AddDays(-30),
                    ReceivableCategory.ServiceExecution,
                    contract1?.Id,
                    "Primeira parcela referente à aprovação dos wireframes e design system.",
                    1,
                    3,
                    "Pagamento confirmado via Pix."
                );
                r1.RegisterPayment(
                    new Money(500000),
                    DateTime.UtcNow.AddDays(-16),
                    PaymentMethod.Pix,
                    "Baixa confirmada via chave Pix CNPJ.",
                    "PIX-20261012-99881",
                    "idemp-seed-pix-001"
                );

                // 2. Conta a Receber Parcialmente Quitada (baixa parcial de 50%)
                var r2 = new Receivable(
                    ws.Id,
                    customers[0].Id,
                    "Parcela 2/3 - Implementação Front-end",
                    new Money(500000), // R$ 5.000,00
                    DateTime.UtcNow.AddDays(5),
                    DateTime.UtcNow.AddDays(-10),
                    ReceivableCategory.ServiceExecution,
                    contract1?.Id,
                    "Segunda parcela referente à entrega da navegação e telas principais.",
                    2,
                    3,
                    "Adiantamento parcial de 50% depositado pelo cliente."
                );
                r2.RegisterPayment(
                    new Money(250000), // R$ 2.500,00
                    DateTime.UtcNow.AddDays(-2),
                    PaymentMethod.BankTransfer,
                    "Entrada parcial via TED confirmada em conta.",
                    "TED-00384729-BR",
                    "idemp-seed-ted-002"
                );

                // 3. Conta a Receber Pendente no prazo (Contrato Recorrente de DevOps)
                var r3 = new Receivable(
                    ws.Id,
                    customers[1].Id,
                    "Mensalidade Outubro - Sustentação & DevOps Cloud",
                    new Money(450000), // R$ 4.500,00
                    DateTime.UtcNow.AddDays(10),
                    DateTime.UtcNow.AddDays(-5),
                    ReceivableCategory.RecurringSubscription,
                    contract2?.Id,
                    "Fatura mensal de sustentação contínua de infraestrutura e monitoramento.",
                    10,
                    12,
                    "Boleto emitido e enviado ao financeiro do cliente."
                );

                // 4. Conta a Receber Vencida (Overdue)
                var r4 = new Receivable(
                    ws.Id,
                    customers[2].Id,
                    "Consultoria Inicial de Processos & Compliance",
                    new Money(350000), // R$ 3.500,00
                    DateTime.UtcNow.AddDays(-7),
                    DateTime.UtcNow.AddDays(-25),
                    ReceivableCategory.Consulting,
                    null,
                    "Diagnóstico presencial de processos internos e mapeamento de riscos.",
                    1,
                    1,
                    "Aguardando confirmação do departamento financeiro do cliente."
                );
                r4.RefreshStatus();

                db.Receivables.AddRange(r1, r2, r3, r4);
            }

            // Despesas Iniciais
            var exp1 = new Expense(
                ws.Id,
                "Assinatura Adobe Creative Cloud & Figma Enterprise",
                ExpenseCategory.SoftwareAndTools,
                new Money(48000), // R$ 480,00
                DateTime.UtcNow.AddDays(-10),
                "Adobe Systems Brasil",
                "Licenças mensais para design e prototipagem.",
                isAlreadyPaid: true,
                paymentDate: DateTime.UtcNow.AddDays(-10),
                paymentMethod: PaymentMethod.CreditCard
            );

            var exp2 = new Expense(
                ws.Id,
                "Servidor em Nuvem Neon PostgreSQL & Vercel",
                ExpenseCategory.SoftwareAndTools,
                new Money(32000), // R$ 320,00
                DateTime.UtcNow.AddDays(-5),
                "Neon Database Inc.",
                "Hospedagem e instâncias de banco de dados gerenciadas.",
                isAlreadyPaid: true,
                paymentDate: DateTime.UtcNow.AddDays(-5),
                paymentMethod: PaymentMethod.CreditCard
            );

            var exp3 = new Expense(
                ws.Id,
                "Locação Estação Coworking & Sala de Reunião",
                ExpenseCategory.OfficeAndCoworking,
                new Money(120000), // R$ 1.200,00
                DateTime.UtcNow.AddDays(8),
                "WeWork Vila Olímpia",
                "Mensalidade da posição fixa de trabalho presencial.",
                isAlreadyPaid: false
            );

            var exp4 = new Expense(
                ws.Id,
                "Assessoria Contábil & Emissão de Notas Fiscais",
                ExpenseCategory.TaxesAndAccounting,
                new Money(65000), // R$ 650,00
                DateTime.UtcNow.AddDays(15),
                "Contabilidade Dinâmica Associados",
                "Honorários mensais e fechamento de balancete.",
                isAlreadyPaid: false
            );

            db.Expenses.AddRange(exp1, exp2, exp3, exp4);
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Aviso ao aplicar migrations automáticas. O banco será criado com EnsureCreated.");
        db.Database.EnsureCreated();
    }
}

app.UseCors(corsPolicyName);

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// Redireciona a raiz "/" para a interface interativa do Swagger em ambiente de desenvolvimento
app.MapGet("/", () => Results.Redirect("/swagger"));

app.MapControllers();

app.Run();

// Necessário para testes de integração com WebApplicationFactory
public partial class Program { }
