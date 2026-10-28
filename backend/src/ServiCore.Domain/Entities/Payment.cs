using ServiCore.Domain.Common;
using ServiCore.Domain.Enums;

namespace ServiCore.Domain.Entities;

public class Payment : BaseEntity, IWorkspaceScoped
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; private set; } = null!;

    public Guid ReceivableId { get; private set; }
    public Receivable Receivable { get; private set; } = null!;

    public Money Amount { get; private set; } = Money.Zero;
    public DateTime PaymentDate { get; private set; }
    public PaymentMethod Method { get; private set; } = PaymentMethod.Pix;
    public string? TransactionReference { get; private set; }
    public string? Notes { get; private set; }
    public string? IdempotencyKey { get; private set; }

    protected Payment() { }

    public Payment(
        Guid workspaceId,
        Guid receivableId,
        Money amount,
        DateTime paymentDate,
        PaymentMethod method,
        string? transactionReference = null,
        string? notes = null,
        string? idempotencyKey = null)
    {
        if (workspaceId == Guid.Empty)
            throw new ArgumentException("O WorkspaceId é obrigatório.", nameof(workspaceId));

        if (receivableId == Guid.Empty)
            throw new ArgumentException("O ReceivableId é obrigatório.", nameof(receivableId));

        if (amount.Cents <= 0)
            throw new ArgumentException("O valor do pagamento deve ser maior que zero.", nameof(amount));

        WorkspaceId = workspaceId;
        ReceivableId = receivableId;
        Amount = amount;
        PaymentDate = paymentDate;
        Method = method;
        TransactionReference = transactionReference?.Trim();
        Notes = notes?.Trim();
        IdempotencyKey = idempotencyKey?.Trim();
    }
}
