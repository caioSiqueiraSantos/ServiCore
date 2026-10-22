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
