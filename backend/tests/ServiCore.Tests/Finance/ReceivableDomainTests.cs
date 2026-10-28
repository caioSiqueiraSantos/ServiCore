using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using Xunit;

namespace ServiCore.Tests.Finance;

public class ReceivableDomainTests
{
    private readonly Guid _workspaceId = Guid.NewGuid();
    private readonly Guid _customerId = Guid.NewGuid();

    [Fact]
    public void Constructor_WithValidArguments_ShouldInitializePendingReceivable()
    {
        // Arrange & Act
        var receivable = new Receivable(
            _workspaceId,
            _customerId,
            "Consultoria em Arquitetura",
            new Money(100000), // R$ 1.000,00
            DateTime.UtcNow.AddDays(10),
            DateTime.UtcNow,
            ReceivableCategory.Consulting,
            null,
            "Fase inicial de diagnóstico.",
            1,
            1,
            "Sem observações"
        );

        // Assert
        Assert.Equal(_workspaceId, receivable.WorkspaceId);
        Assert.Equal(_customerId, receivable.CustomerId);
        Assert.Equal("Consultoria em Arquitetura", receivable.Title);
        Assert.Equal(100000, receivable.Amount.Cents);
        Assert.Equal(0, receivable.PaidAmount.Cents);
        Assert.Equal(100000, receivable.RemainingAmount.Cents);
        Assert.Equal(ReceivableStatus.Pending, receivable.Status);
        Assert.Empty(receivable.Payments);
    }

    [Fact]
    public void Constructor_WithZeroOrNegativeAmount_ShouldThrowArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new Receivable(
            _workspaceId,
            _customerId,
            "Título",
            Money.Zero,
            DateTime.UtcNow.AddDays(10),
            DateTime.UtcNow
        ));
    }

    [Fact]
    public void RegisterPayment_PartialAmount_ShouldUpdateStatusToPartiallyPaid()
    {
        // Arrange
        var receivable = new Receivable(
            _workspaceId,
            _customerId,
            "Desenvolvimento Web",
            new Money(300000), // R$ 3.000,00
            DateTime.UtcNow.AddDays(15),
            DateTime.UtcNow
        );

        // Act
        var payment = receivable.RegisterPayment(
            new Money(100000), // R$ 1.000,00
            DateTime.UtcNow,
            PaymentMethod.Pix,
            "Entrada inicial via Pix",
            "PIX-12345"
        );

        // Assert
        Assert.NotNull(payment);
        Assert.Single(receivable.Payments);
        Assert.Equal(100000, receivable.PaidAmount.Cents);
        Assert.Equal(200000, receivable.RemainingAmount.Cents);
        Assert.Equal(ReceivableStatus.PartiallyPaid, receivable.Status);
    }

    [Fact]
    public void RegisterPayment_MultiplePaymentsUntilFull_ShouldSucceedAndMarkAsPaid()
    {
        // Arrange
        var receivable = new Receivable(
            _workspaceId,
            _customerId,
            "Contrato Recorrente",
            new Money(200000), // R$ 2.000,00
            DateTime.UtcNow.AddDays(10),
            DateTime.UtcNow
        );

        // Act 1: 1ª Baixa parcial de R$ 800,00
        receivable.RegisterPayment(new Money(80000), DateTime.UtcNow, PaymentMethod.BankTransfer);
        Assert.Equal(ReceivableStatus.PartiallyPaid, receivable.Status);
        Assert.Equal(120000, receivable.RemainingAmount.Cents);

        // Act 2: 2ª Baixa de R$ 1.200,00 (quitação)
        receivable.RegisterPayment(new Money(120000), DateTime.UtcNow, PaymentMethod.Pix);

        // Assert
        Assert.Equal(2, receivable.Payments.Count);
        Assert.Equal(200000, receivable.PaidAmount.Cents);
        Assert.Equal(0, receivable.RemainingAmount.Cents);
        Assert.Equal(ReceivableStatus.Paid, receivable.Status);
    }

    [Fact]
    public void RegisterPayment_ExceedingRemainingAmount_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var receivable = new Receivable(
            _workspaceId,
            _customerId,
            "Mentoria",
            new Money(50000), // R$ 500,00
            DateTime.UtcNow.AddDays(5),
            DateTime.UtcNow
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() =>
            receivable.RegisterPayment(new Money(60000), DateTime.UtcNow, PaymentMethod.CreditCard));
    }

    [Fact]
    public void Cancel_WhenPaymentsExist_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var receivable = new Receivable(
            _workspaceId,
            _customerId,
            "Treinamento",
            new Money(100000),
            DateTime.UtcNow.AddDays(10),
            DateTime.UtcNow
        );
        receivable.RegisterPayment(new Money(30000), DateTime.UtcNow, PaymentMethod.Pix);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => receivable.Cancel("Cliente desistiu"));
    }

    [Fact]
    public void RefreshStatus_WhenDueDatePassedAndNoPayments_ShouldMarkAsOverdue()
    {
        // Arrange
        var pastDueDate = DateTime.UtcNow.AddDays(-5);
        var receivable = new Receivable(
            _workspaceId,
            _customerId,
            "Fatura Atrasada",
            new Money(100000),
            pastDueDate,
            pastDueDate.AddDays(-15)
        );

        // Act
        receivable.RefreshStatus();

        // Assert
        Assert.Equal(ReceivableStatus.Overdue, receivable.Status);
    }
}
