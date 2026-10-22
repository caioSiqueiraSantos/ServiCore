using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using Xunit;

namespace ServiCore.Tests.Contracts;

public class ContractDomainTests
{
    [Fact]
    public void CreateContract_WithValidData_ShouldInitializeCorrectly()
    {
        var workspaceId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var startDate = DateTime.UtcNow.Date;
        var endDate = startDate.AddMonths(6);
        var amount = Money.FromCents(1200000); // R$ 12.000,00

        var contract = new Contract(
            workspaceId,
            customerId,
            "Contrato de Consultoria Mensal",
            ContractBillingType.Recurring,
            amount,
            startDate,
            endDate,
            "Serviços mensais de consultoria técnica",
            20m
        );

        Assert.Equal(workspaceId, contract.WorkspaceId);
        Assert.Equal(customerId, contract.CustomerId);
        Assert.Equal("Contrato de Consultoria Mensal", contract.Title);
        Assert.Equal(ContractBillingType.Recurring, contract.Type);
        Assert.Equal(ContractStatus.Draft, contract.Status);
        Assert.Equal(1200000, contract.Amount.Cents);
        Assert.Equal(12000m, contract.Amount.ToDecimal());
        Assert.Equal(startDate, contract.StartDate);
        Assert.Equal(endDate, contract.EndDate);
        Assert.Equal(20m, contract.EstimatedHours);
    }

    [Fact]
    public void CreateContract_WithEndDateBeforeStartDate_ShouldThrowArgumentException()
    {
        var workspaceId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var startDate = DateTime.UtcNow.Date;
        var invalidEndDate = startDate.AddDays(-1);

        var ex = Assert.Throws<ArgumentException>(() =>
            new Contract(
                workspaceId,
                customerId,
                "Contrato Inválido",
                ContractBillingType.FixedPrice,
                Money.FromCents(500000),
                startDate,
                invalidEndDate
            )
        );

        Assert.Contains("data final", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void StatusTransitions_ShouldUpdateStatusProperly()
    {
        var contract = new Contract(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Contrato Ciclo de Vida",
            ContractBillingType.FixedPrice,
            Money.FromCents(500000),
            DateTime.UtcNow
        );

        Assert.Equal(ContractStatus.Draft, contract.Status);

        contract.Activate();
        Assert.Equal(ContractStatus.Active, contract.Status);

        contract.Suspend();
        Assert.Equal(ContractStatus.Suspended, contract.Status);

        contract.Complete();
        Assert.Equal(ContractStatus.Completed, contract.Status);

        contract.Cancel();
        Assert.Equal(ContractStatus.Cancelled, contract.Status);
    }

    [Fact]
    public void ContractItems_AddAndCalculateTotalsCorrectly()
    {
        var contract = new Contract(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Contrato com Itens",
            ContractBillingType.FixedPrice,
            Money.FromCents(1000000),
            DateTime.UtcNow
        );

        var item = new ContractItem(
            contract.Id,
            "Módulo de Autenticação",
            2m,
            Money.FromCents(250000) // R$ 2.500 x 2 = R$ 5.000
        );

        contract.Items.Add(item);

        Assert.Single(contract.Items);
        Assert.Equal(500000, item.TotalPrice.Cents);
        Assert.Equal(5000m, item.TotalPrice.ToDecimal());
    }
}
