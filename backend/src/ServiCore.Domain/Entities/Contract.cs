using ServiCore.Domain.Common;
using ServiCore.Domain.Enums;

namespace ServiCore.Domain.Entities;

public class Contract : BaseEntity, IWorkspaceScoped
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; private set; } = null!;

    public Guid CustomerId { get; private set; }
    public Customer Customer { get; private set; } = null!;

    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public ContractBillingType Type { get; private set; } = ContractBillingType.FixedPrice;
    public ContractStatus Status { get; private set; } = ContractStatus.Draft;

    /// <summary>
    /// Valor monetário estrito em centavos.
    /// Para Preço Fixo: Valor total acordado.
    /// Para Por Hora: Valor cobrado por hora.
    /// Para Recorrente: Valor da mensalidade/período.
    /// </summary>
    public Money Amount { get; private set; } = Money.Zero;

    public decimal? EstimatedHours { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public string? Terms { get; private set; }

    public ICollection<ContractItem> Items { get; private set; } = new List<ContractItem>();
    public ICollection<TaskItem> Tasks { get; private set; } = new List<TaskItem>();
    public ICollection<ContractAttachment> Attachments { get; private set; } = new List<ContractAttachment>();

    protected Contract() { }

    public Contract(
        Guid workspaceId,
        Guid customerId,
        string title,
        ContractBillingType type,
        Money amount,
        DateTime startDate,
        DateTime? endDate = null,
        string? description = null,
        decimal? estimatedHours = null,
        string? terms = null)
    {
        if (workspaceId == Guid.Empty)
            throw new ArgumentException("O WorkspaceId é obrigatório.", nameof(workspaceId));

        if (customerId == Guid.Empty)
            throw new ArgumentException("O CustomerId é obrigatório.", nameof(customerId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("O título do contrato é obrigatório.", nameof(title));

        if (endDate.HasValue && endDate.Value < startDate)
            throw new ArgumentException("A data final não pode ser anterior à data inicial do contrato.", nameof(endDate));

        WorkspaceId = workspaceId;
        CustomerId = customerId;
        Title = title.Trim();
        Type = type;
        Amount = amount;
        StartDate = startDate;
        EndDate = endDate;
        Description = description?.Trim();
        EstimatedHours = estimatedHours;
        Terms = terms?.Trim();
        Status = ContractStatus.Draft;
    }

    public void Update(
        Guid customerId,
        string title,
        ContractBillingType type,
        Money amount,
        DateTime startDate,
        DateTime? endDate,
        string? description,
        decimal? estimatedHours,
        string? terms)
    {
        if (customerId == Guid.Empty)
            throw new ArgumentException("O CustomerId é obrigatório.", nameof(customerId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("O título do contrato é obrigatório.", nameof(title));

        if (endDate.HasValue && endDate.Value < startDate)
            throw new ArgumentException("A data final não pode ser anterior à data inicial do contrato.", nameof(endDate));

        CustomerId = customerId;
        Title = title.Trim();
        Type = type;
        Amount = amount;
        StartDate = startDate;
        EndDate = endDate;
        Description = description?.Trim();
        EstimatedHours = estimatedHours;
        Terms = terms?.Trim();
        MarkAsUpdated();
    }

    public void ChangeStatus(ContractStatus newStatus)
    {
        Status = newStatus;
        MarkAsUpdated();
    }

    public void Activate() => ChangeStatus(ContractStatus.Active);
    public void Suspend() => ChangeStatus(ContractStatus.Suspended);
    public void Complete() => ChangeStatus(ContractStatus.Completed);
    public void Cancel() => ChangeStatus(ContractStatus.Cancelled);
}
