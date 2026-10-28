using ServiCore.Domain.Common;
using ServiCore.Domain.Enums;

namespace ServiCore.Domain.Entities;

public class Receivable : BaseEntity, IWorkspaceScoped
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; private set; } = null!;

    public Guid CustomerId { get; private set; }
    public Customer Customer { get; private set; } = null!;

    public Guid? ContractId { get; private set; }
    public Contract? Contract { get; private set; }

    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public ReceivableCategory Category { get; private set; } = ReceivableCategory.ServiceExecution;

    /// <summary>
    /// Valor monetário total a receber em centavos.
    /// </summary>
    public Money Amount { get; private set; } = Money.Zero;

    /// <summary>
    /// Total já baixado/pago em centavos.
    /// </summary>
    public Money PaidAmount { get; private set; } = Money.Zero;

    public Money RemainingAmount => Money.FromCents(Math.Max(0, Amount.Cents - PaidAmount.Cents));

    public DateTime DueDate { get; private set; }
    public DateTime IssueDate { get; private set; }
    public ReceivableStatus Status { get; private set; } = ReceivableStatus.Pending;

    public int? InstallmentNumber { get; private set; }
    public int? TotalInstallments { get; private set; }
    public string? Notes { get; private set; }

    public ICollection<Payment> Payments { get; private set; } = new List<Payment>();

    protected Receivable() { }

    public Receivable(
        Guid workspaceId,
        Guid customerId,
        string title,
        Money amount,
        DateTime dueDate,
        DateTime issueDate,
        ReceivableCategory category = ReceivableCategory.ServiceExecution,
        Guid? contractId = null,
        string? description = null,
        int? installmentNumber = null,
        int? totalInstallments = null,
        string? notes = null)
    {
        if (workspaceId == Guid.Empty)
            throw new ArgumentException("O WorkspaceId é obrigatório.", nameof(workspaceId));

        if (customerId == Guid.Empty)
            throw new ArgumentException("O CustomerId é obrigatório.", nameof(customerId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("O título da conta a receber é obrigatório.", nameof(title));

        if (amount.Cents <= 0)
            throw new ArgumentException("O valor a receber deve ser maior que zero.", nameof(amount));

        WorkspaceId = workspaceId;
        CustomerId = customerId;
        ContractId = contractId;
        Title = title.Trim();
        Description = description?.Trim();
        Category = category;
        Amount = amount;
        PaidAmount = Money.Zero;
        DueDate = dueDate;
        IssueDate = issueDate;
        InstallmentNumber = installmentNumber;
        TotalInstallments = totalInstallments;
        Notes = notes?.Trim();
        Status = ReceivableStatus.Pending;
    }

    public void Update(
        Guid customerId,
        string title,
        Money amount,
        DateTime dueDate,
        DateTime issueDate,
        ReceivableCategory category,
        Guid? contractId,
        string? description,
        int? installmentNumber,
        int? totalInstallments,
        string? notes)
    {
        if (customerId == Guid.Empty)
            throw new ArgumentException("O CustomerId é obrigatório.", nameof(customerId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("O título da conta a receber é obrigatório.", nameof(title));

        if (amount.Cents <= 0)
            throw new ArgumentException("O valor a receber deve ser maior que zero.", nameof(amount));

        if (amount.Cents < PaidAmount.Cents)
            throw new InvalidOperationException("O novo valor não pode ser inferior ao valor já pago (" + PaidAmount.ToString() + ").");

        CustomerId = customerId;
        ContractId = contractId;
        Title = title.Trim();
        Description = description?.Trim();
        Category = category;
        Amount = amount;
        DueDate = dueDate;
        IssueDate = issueDate;
        InstallmentNumber = installmentNumber;
        TotalInstallments = totalInstallments;
        Notes = notes?.Trim();

        RefreshStatus();
    }

    public Payment RegisterPayment(
        Money paymentAmount,
        DateTime paymentDate,
        PaymentMethod method,
        string? notes = null,
        string? transactionReference = null,
        string? idempotencyKey = null)
    {
        if (Status == ReceivableStatus.Cancelled)
            throw new InvalidOperationException("Não é permitido registrar pagamentos em uma conta cancelada.");

        if (Status == ReceivableStatus.Paid)
            throw new InvalidOperationException("Esta conta a receber já está totalmente quitada.");

        if (paymentAmount.Cents <= 0)
            throw new ArgumentException("O valor do pagamento deve ser maior que zero.", nameof(paymentAmount));

        if (paymentAmount.Cents > RemainingAmount.Cents)
            throw new InvalidOperationException($"O valor do pagamento ({paymentAmount}) excede o saldo restante a pagar ({RemainingAmount}).");

        var payment = new Payment(
            WorkspaceId,
            Id,
            paymentAmount,
            paymentDate,
            method,
            transactionReference,
            notes,
            idempotencyKey);

        Payments.Add(payment);
        PaidAmount = Money.FromCents(PaidAmount.Cents + paymentAmount.Cents);

        RefreshStatus();

        return payment;
    }

    public void RefreshStatus(DateTime? referenceDate = null)
    {
        if (Status == ReceivableStatus.Cancelled)
            return;

        if (PaidAmount.Cents >= Amount.Cents)
        {
            Status = ReceivableStatus.Paid;
        }
        else if (PaidAmount.Cents > 0)
        {
            Status = ReceivableStatus.PartiallyPaid;
        }
        else
        {
            var now = referenceDate ?? DateTime.UtcNow;
            if (now.Date > DueDate.Date)
            {
                Status = ReceivableStatus.Overdue;
            }
            else
            {
                Status = ReceivableStatus.Pending;
            }
        }
    }

    public void Cancel(string? reason = null)
    {
        if (PaidAmount.Cents > 0)
            throw new InvalidOperationException("Não é possível cancelar uma conta a receber que já possui pagamentos registrados.");

        Status = ReceivableStatus.Cancelled;
        if (!string.IsNullOrWhiteSpace(reason))
        {
            Notes = string.IsNullOrWhiteSpace(Notes)
                ? $"Cancelamento: {reason.Trim()}"
                : $"{Notes}\n[Cancelamento: {reason.Trim()}]";
        }
    }
}
