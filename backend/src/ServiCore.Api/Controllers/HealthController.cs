using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;

namespace ServiCore.Api.Controllers;

public class HealthController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public HealthController(IAppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    /// <summary>
    /// Verifica a saúde geral da API e da conexão com o banco de dados SQLite.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetHealth()
    {
        bool dbConnected = false;
        try
        {
            if (_context is DbContext dbContext)
            {
                dbConnected = await dbContext.Database.CanConnectAsync();
            }
        }
        catch
        {
            dbConnected = false;
        }

        var healthData = new
        {
            Status = dbConnected ? "Healthy" : "Degraded",
            Database = dbConnected ? "Connected" : "Disconnected",
            TimestampUtc = DateTime.UtcNow
        };

        return Ok(ApiResponse<object>.Ok(healthData, "Verificação de integridade executada com sucesso."));
    }

    /// <summary>
    /// Retorna detalhes técnicos do sistema e ambiente de execução.
    /// </summary>
    [HttpGet("system")]
    public async Task<ActionResult<ApiResponse<SystemStatusDto>>> GetSystemInfo()
    {
        bool dbConnected = false;
        try
        {
            if (_context is DbContext dbContext)
            {
                dbConnected = await dbContext.Database.CanConnectAsync();
            }
        }
        catch
        {
            dbConnected = false;
        }

        var info = new SystemStatusDto
        {
            AppName = "ServiCore API",
            Version = "1.0.0-foundation",
            Environment = _env.EnvironmentName,
            DatabaseProvider = "SQLite",
            DatabaseCanConnect = dbConnected,
            ServerTimeUtc = DateTime.UtcNow,
            Status = dbConnected ? "Online" : "Degraded"
        };

        return Ok(ApiResponse<SystemStatusDto>.Ok(info));
    }

    /// <summary>
    /// Retorna dados demonstrativos iniciais para validação visual do dashboard na Etapa 1.
    /// Os dados são explicitamente sinalizados como demonstrativos.
    /// </summary>
    [HttpGet("demo-stats")]
    public ActionResult<ApiResponse<object>> GetDemoDashboardStats()
    {
        var demoData = new
        {
            IsDemonstrative = true,
            Note = "Dados demonstrativos para validação visual da composição da interface (Etapa 1 - Fundação).",
            Period = "Outubro / 2026",
            Kpis = new
            {
                TotalReceivedCents = 1450000L,        // R$ 14.500,00
                PendingReceivablesCents = 820000L,    // R$ 8.200,00
                OverdueCents = 120000L,              // R$ 1.200,00
                PaidExpensesCents = 345000L,          // R$ 3.450,00
                ActiveContractsCount = 8,
                OngoingTasksCount = 14,
                UpcomingEventsCount = 3
            },
            RecentCommitments = new[]
            {
                new { Title = "Reunião de alinhamento com Nexus Tech", Date = DateTime.UtcNow.AddHours(3), Type = "Reunião", Client = "Nexus Tech Ltda" },
                new { Title = "Entrega da Fase 1 - Design System", Date = DateTime.UtcNow.AddDays(1), Type = "Entrega", Client = "Studio Alfa" },
                new { Title = "Revisão de faturamento mensal", Date = DateTime.UtcNow.AddDays(2), Type = "Financeiro", Client = "Interno" }
            },
            CashFlowSeries = new[]
            {
                new { Month = "Mai", Received = 9800.0, Expenses = 2400.0 },
                new { Month = "Jun", Received = 11200.0, Expenses = 3100.0 },
                new { Month = "Jul", Received = 10500.0, Expenses = 2800.0 },
                new { Month = "Ago", Received = 13400.0, Expenses = 3500.0 },
                new { Month = "Set", Received = 12100.0, Expenses = 2900.0 },
                new { Month = "Out (Atual)", Received = 14500.0, Expenses = 3450.0 }
            }
        };

        return Ok(ApiResponse<object>.Ok(demoData, "Dados demonstrativos carregados com sucesso."));
    }
}
