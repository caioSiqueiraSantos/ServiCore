using ServiCore.Domain.Common;
using ServiCore.Domain.Enums;

namespace ServiCore.Domain.Entities;

public class ServiceItem : BaseEntity, IWorkspaceScoped
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; private set; } = null!;

    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public Money DefaultPrice { get; private set; } = Money.Zero;
    public ServiceBillingUnit BillingUnit { get; private set; } = ServiceBillingUnit.Hour;
    public decimal? EstimatedHours { get; private set; }
    public ServiceStatus Status { get; private set; } = ServiceStatus.Active;

    protected ServiceItem() { }

    public ServiceItem(
        Guid workspaceId,
        string name,
        Money defaultPrice,
        ServiceBillingUnit billingUnit = ServiceBillingUnit.Hour,
        string? description = null,
        decimal? estimatedHours = null)
    {
        if (workspaceId == Guid.Empty)
            throw new ArgumentException("O WorkspaceId é obrigatório.", nameof(workspaceId));

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("O nome do serviço é obrigatório.", nameof(name));

        WorkspaceId = workspaceId;
        Name = name.Trim();
        DefaultPrice = defaultPrice;
        BillingUnit = billingUnit;
        Description = description?.Trim();
        EstimatedHours = estimatedHours;
        Status = ServiceStatus.Active;
    }

    public void Update(
        string name,
        Money defaultPrice,
        ServiceBillingUnit billingUnit,
        string? description,
        decimal? estimatedHours,
        ServiceStatus status)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("O nome do serviço é obrigatório.", nameof(name));

        Name = name.Trim();
        DefaultPrice = defaultPrice;
        BillingUnit = billingUnit;
        Description = description?.Trim();
        EstimatedHours = estimatedHours;
        Status = status;
        MarkAsUpdated();
    }

    public void Activate()
    {
        Status = ServiceStatus.Active;
        MarkAsUpdated();
    }

    public void Deactivate()
    {
        Status = ServiceStatus.Inactive;
        MarkAsUpdated();
    }
}
