using ServiCore.Domain.Common;
using ServiCore.Domain.Enums;

namespace ServiCore.Domain.Entities;

public class TaskItem : BaseEntity, IWorkspaceScoped
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; private set; } = null!;

    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    public Guid? CustomerId { get; private set; }
    public Customer? Customer { get; private set; }

    public Guid? ContractId { get; private set; }
    public Contract? Contract { get; private set; }

    public Guid? ServiceItemId { get; private set; }
    public ServiceItem? ServiceItem { get; private set; }

    public TaskPriority Priority { get; private set; } = TaskPriority.Medium;
    public TaskItemStatus Status { get; private set; } = TaskItemStatus.Pending;

    public DateTime? DueDate { get; private set; }
    public int? EstimatedMinutes { get; private set; }
    public int? SpentMinutes { get; private set; }
    public DateTime? CompletedAtUtc { get; private set; }

    protected TaskItem() { }

    public TaskItem(
        Guid workspaceId,
        string title,
        TaskPriority priority = TaskPriority.Medium,
        string? description = null,
        Guid? customerId = null,
        Guid? contractId = null,
        Guid? serviceItemId = null,
        DateTime? dueDate = null,
        int? estimatedMinutes = null)
    {
        if (workspaceId == Guid.Empty)
            throw new ArgumentException("O WorkspaceId é obrigatório.", nameof(workspaceId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("O título da tarefa é obrigatório.", nameof(title));

        WorkspaceId = workspaceId;
        Title = title.Trim();
        Priority = priority;
        Description = description?.Trim();
        CustomerId = customerId;
        ContractId = contractId;
        ServiceItemId = serviceItemId;
        DueDate = dueDate;
        EstimatedMinutes = estimatedMinutes;
        Status = TaskItemStatus.Pending;
        SpentMinutes = 0;
    }

    public void Update(
        string title,
        TaskPriority priority,
        string? description,
        Guid? customerId,
        Guid? contractId,
        Guid? serviceItemId,
        DateTime? dueDate,
        int? estimatedMinutes)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("O título da tarefa é obrigatório.", nameof(title));

        Title = title.Trim();
        Priority = priority;
        Description = description?.Trim();
        CustomerId = customerId;
        ContractId = contractId;
        ServiceItemId = serviceItemId;
        DueDate = dueDate;
        EstimatedMinutes = estimatedMinutes;
        MarkAsUpdated();
    }

    public void ChangeStatus(TaskItemStatus newStatus)
    {
        Status = newStatus;
        if (newStatus == TaskItemStatus.Completed)
        {
            CompletedAtUtc = DateTime.UtcNow;
        }
        else
        {
            CompletedAtUtc = null;
        }
        MarkAsUpdated();
    }

    public void AddSpentMinutes(int minutes)
    {
        if (minutes < 0) throw new ArgumentOutOfRangeException(nameof(minutes), "Minutos devem ser positivos.");
        SpentMinutes = (SpentMinutes ?? 0) + minutes;
        MarkAsUpdated();
    }
}
