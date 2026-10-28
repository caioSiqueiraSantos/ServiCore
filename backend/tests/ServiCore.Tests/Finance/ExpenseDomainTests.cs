using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using Xunit;

namespace ServiCore.Tests.Finance;

public class ExpenseDomainTests
{
    private readonly Guid _workspaceId = Guid.NewGuid();

    [Fact]
    public void Constructor_WithValidArguments_ShouldInitializePendingExpense()
    {
        // Arrange & Act
        var expense = new Expense(
            _workspaceId,
            "Assinatura Figma Professional",
            ExpenseCategory.SoftwareAndTools,
            new Money(15000), // R$ 150,00
            DateTime.UtcNow.AddDays(7),
            "Figma Inc.",
            "Licença individual mensal"
        );

        // Assert
        Assert.Equal(_workspaceId, expense.WorkspaceId);
        Assert.Equal("Assinatura Figma Professional", expense.Description);
        Assert.Equal(ExpenseCategory.SoftwareAndTools, expense.Category);
        Assert.Equal(15000, expense.Amount.Cents);
        Assert.Equal(ExpenseStatus.Pending, expense.Status);
        Assert.Null(expense.PaymentDate);
    }

    [Fact]
    public void Constructor_WithZeroOrNegativeAmount_ShouldThrowArgumentException()
    {
        Assert.Throws<ArgumentException>(() => new Expense(
            _workspaceId,
            "Despesa Inválida",
            ExpenseCategory.Other,
            Money.Zero,
            DateTime.UtcNow.AddDays(5)
        ));
    }

    [Fact]
    public void MarkAsPaid_ShouldUpdateStatusAndPaymentDetails()
    {
        // Arrange
        var expense = new Expense(
            _workspaceId,
            "Coworking Mensal",
            ExpenseCategory.OfficeAndCoworking,
            new Money(90000), // R$ 900,00
            DateTime.UtcNow.AddDays(3)
        );

        var paymentDate = DateTime.UtcNow;

        // Act
        expense.MarkAsPaid(paymentDate, PaymentMethod.Pix, "Comprovante 99881");

        // Assert
        Assert.Equal(ExpenseStatus.Paid, expense.Status);
        Assert.Equal(paymentDate, expense.PaymentDate);
        Assert.Equal(PaymentMethod.Pix, expense.PaymentMethod);
        Assert.Contains("Comprovante 99881", expense.Notes);
    }

    [Fact]
    public void Cancel_WhenPaid_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var expense = new Expense(
            _workspaceId,
            "Internet Fibra",
            ExpenseCategory.OfficeAndCoworking,
            new Money(20000),
            DateTime.UtcNow.AddDays(-2),
            isAlreadyPaid: true
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => expense.Cancel("Cancelamento indevido"));
    }

    [Fact]
    public void RefreshStatus_WhenDueDatePassed_ShouldMarkAsOverdue()
    {
        // Arrange
        var expense = new Expense(
            _workspaceId,
            "Conta de Energia",
            ExpenseCategory.OfficeAndCoworking,
            new Money(25000),
            DateTime.UtcNow.AddDays(-3)
        );

        // Act
        expense.RefreshStatus();

        // Assert
        Assert.Equal(ExpenseStatus.Overdue, expense.Status);
    }
}
