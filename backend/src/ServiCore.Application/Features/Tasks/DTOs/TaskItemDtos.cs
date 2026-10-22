using ServiCore.Domain.Enums;

namespace ServiCore.Application.Features.Tasks.DTOs;

public class TaskItemDto
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public Guid? ContractId { get; set; }
    public string? ContractTitle { get; set; }
    public Guid? ServiceItemId { get; set; }
    public string? ServiceItemName { get; set; }
    public TaskPriority Priority { get; set; }
    public TaskItemStatus Status { get; set; }
    public DateTime? DueDate { get; set; }
    public int? EstimatedMinutes { get; set; }
    public int? SpentMinutes { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class CreateTaskItemDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? ContractId { get; set; }
    public Guid? ServiceItemId { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateTime? DueDate { get; set; }
    public int? EstimatedMinutes { get; set; }
}

public class UpdateTaskItemDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? ContractId { get; set; }
    public Guid? ServiceItemId { get; set; }
    public TaskPriority Priority { get; set; }
    public DateTime? DueDate { get; set; }
    public int? EstimatedMinutes { get; set; }
    public int? SpentMinutes { get; set; }
}

public class UpdateTaskStatusDto
{
    public TaskItemStatus Status { get; set; }
}

public class TaskItemFilterParams
{
    public string? Search { get; set; }
    public TaskItemStatus? Status { get; set; }
    public TaskPriority? Priority { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? ContractId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "duedate";
    public bool SortDescending { get; set; } = false;
}
