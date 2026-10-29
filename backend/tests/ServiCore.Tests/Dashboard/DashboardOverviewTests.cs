using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ServiCore.Api.Controllers;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Audit.DTOs;
using ServiCore.Application.Features.Dashboard.DTOs;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using ServiCore.Infrastructure.Persistence;
using Xunit;

namespace ServiCore.Tests.Dashboard;

public class TestWorkspaceService : ICurrentWorkspaceService
{
    public Guid? WorkspaceId { get; set; }
    public Guid? UserId { get; set; }
}

public class DashboardOverviewTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<ServiCoreDbContext> _options;
    private readonly TestWorkspaceService _workspaceService;

    public DashboardOverviewTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<ServiCoreDbContext>()
            .UseSqlite(_connection)
            .Options;

        _workspaceService = new TestWorkspaceService();

        using var context = new ServiCoreDbContext(_options, _workspaceService);
        context.Database.EnsureCreated();
    }

    [Fact]
    public async Task GetOverview_WithActiveEntities_ShouldReturnAggregatedMetrics()
    {
        // Arrange
        var ws = new Workspace("Workspace Dashboard Test", WorkspaceType.Individual);
        _workspaceService.WorkspaceId = ws.Id;

        var customer = new Customer(ws.Id, "Cliente Alfa", CustomerType.Company, "Studio Alfa");
        var contract = new Contract(ws.Id, customer.Id, "Contrato Anual", ContractBillingType.FixedPrice, new Money(120000), DateTime.UtcNow, DateTime.UtcNow.AddMonths(12));
        contract.Activate();
        var task = new TaskItem(ws.Id, "Entrega do Design", TaskPriority.High, description: null, customerId: customer.Id, contractId: contract.Id);

        var receivable = new Receivable(ws.Id, customer.Id, "Fatura Inicial", new Money(120000), DateTime.UtcNow.AddDays(10), DateTime.UtcNow, ReceivableCategory.ServiceExecution, contract.Id);
        var expense = new Expense(ws.Id, "Assinatura Figma", ExpenseCategory.SoftwareAndTools, new Money(15000), DateTime.UtcNow);
        expense.MarkAsPaid(DateTime.UtcNow, PaymentMethod.CreditCard);

        var auditLog = new AuditLog(ws.Id, Guid.NewGuid(), "CustomerCreated", "Customer", customer.Id.ToString(), "{\"name\":\"Cliente Alfa\"}");

        using (var setupContext = new ServiCoreDbContext(_options, _workspaceService))
        {
            setupContext.Workspaces.Add(ws);
            setupContext.Customers.Add(customer);
            setupContext.Contracts.Add(contract);
            setupContext.Tasks.Add(task);
            setupContext.Receivables.Add(receivable);
            setupContext.Expenses.Add(expense);
            setupContext.AuditLogs.Add(auditLog);
            await setupContext.SaveChangesAsync();
        }

        using var testContext = new ServiCoreDbContext(_options, _workspaceService);
        var controller = new DashboardController(testContext, _workspaceService);

        // Act
        var actionResult = await controller.GetOverview();
        var okResult = actionResult.Result as OkObjectResult;
        Assert.NotNull(okResult);

        var response = okResult.Value as ApiResponse<DashboardOverviewDto>;
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);

        var data = response.Data;
        Assert.Equal(1, data.Kpis.TotalCustomersCount);
        Assert.Equal(1, data.Kpis.ActiveContractsCount);
        Assert.Equal(1, data.Kpis.OngoingTasksCount);
        Assert.Equal(120000, data.Kpis.PendingReceivablesCents);
        Assert.Equal(15000, data.Kpis.PaidExpensesCents);
        Assert.Single(data.RecentActivities);
    }

    [Fact]
    public async Task GetAuditLogs_ShouldReturnAuditedLogsFilteredByWorkspace()
    {
        // Arrange
        var ws = new Workspace("Workspace Audit Test", WorkspaceType.Individual);
        _workspaceService.WorkspaceId = ws.Id;

        var user = new User("Administrador Geral", "admin@teste.com", "hash");
        var log1 = new AuditLog(ws.Id, user.Id, "ContractCreated", "Contract", Guid.NewGuid().ToString(), "{}");
        var log2 = new AuditLog(ws.Id, user.Id, "PaymentReceived", "Receivable", Guid.NewGuid().ToString(), "{}");

        using (var setupContext = new ServiCoreDbContext(_options, _workspaceService))
        {
            setupContext.Workspaces.Add(ws);
            setupContext.Users.Add(user);
            setupContext.AuditLogs.AddRange(log1, log2);
            await setupContext.SaveChangesAsync();
        }

        using var testContext = new ServiCoreDbContext(_options, _workspaceService);
        var controller = new AuditLogsController(testContext, _workspaceService);

        // Act
        var actionResult = await controller.GetAuditLogs(entityName: "Contract", action: null, limit: 10);
        var okResult = actionResult.Result as OkObjectResult;
        Assert.NotNull(okResult);

        var response = okResult.Value as ApiResponse<List<AuditLogDto>>;
        Assert.NotNull(response);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
        Assert.Single(response.Data);
        Assert.Equal("Contract", response.Data[0].EntityName);
        Assert.Equal("Administrador Geral", response.Data[0].UserFullName);
    }

    public void Dispose()
    {
        _connection.Dispose();
    }
}
