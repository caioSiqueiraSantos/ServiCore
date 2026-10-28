using ServiCore.Domain.Common;
using ServiCore.Domain.Enums;

namespace ServiCore.Domain.Entities;

public class Expense : BaseEntity, IWorkspaceScoped
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; private set; } = null!;

    public string Description { get; private set; } = string.Empty;
    public ExpenseCategory Category { get; private set; } = ExpenseCategory.Other;

    /// <summary>
    /// Valor da despesa estrito em centavos.
    /// </summary>
    public Money Amount { get; private set; } = Money.Zero;

    public DateTime DueDate { get; private set; }
    public DateTime? PaymentDate { get; private set; }
    public ExpenseStatus Status { get; private set; } = ExpenseStatus.Pending;
    public PaymentMethod? PaymentMethod { get; private set; }

    public string? Supplier { get; private set; }
    public string? Notes { get; private set; }

    protected Expense() { }

    public Expense(
        Guid workspaceId,
        string description,
        ExpenseCategory category,
        Money amount,
        DateTime dueDate,
        string? supplier = null,
        string? notes = null,
        bool isAlreadyPaid = false,
        DateTime? paymentDate = null,
        PaymentMethod? paymentMethod = null)
    {
        if (workspaceId == Guid.Empty)
            throw new ArgumentException("O WorkspaceId é obrigatório.", nameof(workspaceId));

        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("A descrição da despesa é obrigatória.", nameof(description));

        if (amount.Cents <= 0)
            throw new ArgumentException("O valor da despesa deve ser maior que zero.", nameof(amount));

        WorkspaceId = workspaceId;
        Description = description.Trim();
        Category = category;
        Amount = amount;
        DueDate = dueDate;
        Supplier = supplier?.Trim();
        Notes = notes?.Trim();

        if (isAlreadyPaid)
        {
            Status = ExpenseStatus.Paid;
            PaymentDate = paymentDate ?? DateTime.UtcNow;
            PaymentMethod = paymentMethod ?? Enums.PaymentMethod.Pix;
        }
        else
        {
            Status = ExpenseStatus.Pending;
            PaymentDate = null;
            PaymentMethod = null;
            RefreshStatus();
        }
    }

    public void Update(
        string description,
        ExpenseCategory category,
        Money amount,
        DateTime dueDate,
        string? supplier,
        string? notes)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("A descrição da despesa é obrigatória.", nameof(description));

        if (amount.Cents <= 0)
            throw new ArgumentException("O valor da despesa deve ser maior que zero.", nameof(amount));

        Description = description.Trim();
        Category = category;
        Amount = amount;
        DueDate = dueDate;
        Supplier = supplier?.Trim();
        Notes = notes?.Trim();

        RefreshStatus();
    }

    public void MarkAsPaid(DateTime paymentDate, PaymentMethod method, string? notes = null)
    {
        if (Status == ExpenseStatus.Cancelled)
            throw new InvalidOperationException("Não é possível liquidar uma despesa cancelada.");

        Status = ExpenseStatus.Paid;
        PaymentDate = paymentDate;
        PaymentMethod = method;

        if (!string.IsNullOrWhiteSpace(notes))
        {
            Notes = string.IsNullOrWhiteSpace(Notes)
                ? notes.Trim()
                : $"{Notes}\n[Pagamento: {notes.Trim()}]";
        }
    }

    public void RefreshStatus(DateTime? referenceDate = null)
    {
        if (Status == ExpenseStatus.Cancelled || Status == ExpenseStatus.Paid)
            return;

        var now = referenceDate ?? DateTime.UtcNow;
        if (now.Date > DueDate.Date)
        {
            Status = ExpenseStatus.Overdue;
        }
        else
        {
            Status = ExpenseStatus.Pending;
        }
    }

    public void Cancel(string? reason = null)
    {
        if (Status == ExpenseStatus.Paid)
            throw new InvalidOperationException("Não é possível cancelar uma despesa já liquidada.");

        Status = ExpenseStatus.Cancelled;
        if (!string.IsNullOrWhiteSpace(reason))
        {
            Notes = string.IsNullOrWhiteSpace(Notes)
                ? $"Cancelamento: {reason.Trim()}"
                : $"{Notes}\n[Cancelamento: {reason.Trim()}]";
        }
    }
}
