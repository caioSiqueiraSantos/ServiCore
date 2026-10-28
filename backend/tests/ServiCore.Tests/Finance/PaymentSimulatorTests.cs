using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ServiCore.Api.Controllers;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Finance.DTOs;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using ServiCore.Infrastructure.Persistence;
using Xunit;

namespace ServiCore.Tests.Finance;

public class TestWorkspaceService : ICurrentWorkspaceService
{
    public Guid? WorkspaceId { get; set; }
    public Guid? UserId { get; set; }
}

public class PaymentSimulatorTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<ServiCoreDbContext> _options;
    private readonly TestWorkspaceService _workspaceService;

    public PaymentSimulatorTests()
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
    public async Task SimulatePayment_FirstCall_ShouldProcessPaymentAndRegisterIdempotencyKey()
    {
        // Arrange
        var ws = new Workspace("Workspace Teste", WorkspaceType.Individual);
        _workspaceService.WorkspaceId = ws.Id;
        var customer = new Customer(ws.Id, "Cliente Teste", CustomerType.Individual);

        var receivable = new Receivable(
            ws.Id,
            customer.Id,
            "Fatura Teste",
            new Money(50000), // R$ 500,00
            DateTime.UtcNow.AddDays(5),
            DateTime.UtcNow
        );

        using (var setupContext = new ServiCoreDbContext(_options, _workspaceService))
        {
            setupContext.Workspaces.Add(ws);
            setupContext.Customers.Add(customer);
            setupContext.Receivables.Add(receivable);
            await setupContext.SaveChangesAsync();
        }

        using var context = new ServiCoreDbContext(_options, _workspaceService);
        var controller = new FinanceController(context, _workspaceService);
        var idempotencyKey = "key-test-idemp-12345";

        var request = new SimulatePaymentRequest(
            receivable.Id,
            25000, // R$ 250,00 (50%)
            PaymentMethod.Pix,
            idempotencyKey,
            "123.456.789-00",
            null,
            null,
            "Simulação de teste Pix"
        );

        // Act
        var result = await controller.SimulatePayment(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var apiResponse = Assert.IsType<ApiResponse<SimulatePaymentResponse>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.False(apiResponse.Data!.IsIdempotentReplay);
        Assert.Equal(25000, apiResponse.Data.AmountPaidCents);
        Assert.Equal(25000, apiResponse.Data.RemainingBalanceCents);
        Assert.Equal(ReceivableStatus.PartiallyPaid.ToString(), apiResponse.Data.ReceivableNewStatus);

        // Verifica persistência
        var persistedPayment = await context.Payments.FirstOrDefaultAsync(p => p.IdempotencyKey == idempotencyKey);
        Assert.NotNull(persistedPayment);
        Assert.Equal(25000, persistedPayment.Amount.Cents);
    }

    [Fact]
    public async Task SimulatePayment_DuplicateCallWithSameIdempotencyKey_ShouldReturnReplayWithoutDuplicatingPayment()
    {
        // Arrange
        var ws = new Workspace("Workspace Teste 2", WorkspaceType.Individual);
        _workspaceService.WorkspaceId = ws.Id;
        var customer = new Customer(ws.Id, "Cliente Teste 2", CustomerType.Individual);

        var receivable = new Receivable(
            ws.Id,
            customer.Id,
            "Fatura Teste Idempotente",
            new Money(40000), // R$ 400,00
            DateTime.UtcNow.AddDays(10),
            DateTime.UtcNow
        );

        using (var setupContext = new ServiCoreDbContext(_options, _workspaceService))
        {
            setupContext.Workspaces.Add(ws);
            setupContext.Customers.Add(customer);
            setupContext.Receivables.Add(receivable);
            await setupContext.SaveChangesAsync();
        }

        var idempotencyKey = "key-duplicate-check-789";

        var request = new SimulatePaymentRequest(
            receivable.Id,
            20000,
            PaymentMethod.CreditCard,
            idempotencyKey,
            null,
            "4111********1111",
            "MOCK USER",
            "Simulação Cartão"
        );

        // 1ª Chamada
        using (var context1 = new ServiCoreDbContext(_options, _workspaceService))
        {
            var controller1 = new FinanceController(context1, _workspaceService);
            var result1 = await controller1.SimulatePayment(request);
            var okResult1 = Assert.IsType<OkObjectResult>(result1.Result);
            var res1 = Assert.IsType<ApiResponse<SimulatePaymentResponse>>(okResult1.Value);
            Assert.False(res1.Data!.IsIdempotentReplay);
        }

        // 2ª Chamada idêntica (Simulando clique duplo do usuário ou retry de rede com novo request HTTP)
        using (var context2 = new ServiCoreDbContext(_options, _workspaceService))
        {
            var controller2 = new FinanceController(context2, _workspaceService);
            var result2 = await controller2.SimulatePayment(request);
            var okResult2 = Assert.IsType<OkObjectResult>(result2.Result);
            var res2 = Assert.IsType<ApiResponse<SimulatePaymentResponse>>(okResult2.Value);

            // Assert: A 2ª chamada detectou a chave, não gerou pagamento duplicado e retornou replay
            Assert.True(res2.Data!.IsIdempotentReplay);
            Assert.Equal(20000, res2.Data.AmountPaidCents);

            // Total de pagamentos gravados no banco para esta conta deve ser exatamente 1!
            var paymentsCount = await context2.Payments.CountAsync(p => p.ReceivableId == receivable.Id);
            Assert.Equal(1, paymentsCount);

            var reloadedRec = await context2.Receivables.FirstAsync(r => r.Id == receivable.Id);
            Assert.Equal(20000, reloadedRec.PaidAmount.Cents);
            Assert.Equal(20000, reloadedRec.RemainingAmount.Cents);
        }
    }

    public void Dispose()
    {
        _connection.Close();
        _connection.Dispose();
    }
}
