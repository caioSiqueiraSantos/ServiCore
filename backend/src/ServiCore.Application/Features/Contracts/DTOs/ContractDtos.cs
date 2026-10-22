using ServiCore.Domain.Enums;

namespace ServiCore.Application.Features.Contracts.DTOs;

public class ContractDto
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ContractBillingType Type { get; set; }
    public ContractStatus Status { get; set; }
    public long AmountCents { get; set; }
    public decimal AmountDecimal => AmountCents / 100m;
    public decimal? EstimatedHours { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Terms { get; set; }
    public int TasksCount { get; set; }
    public int CompletedTasksCount { get; set; }
    public int AttachmentsCount { get; set; }
    public List<ContractItemDto> Items { get; set; } = new();
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class ContractItemDto
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public Guid? ServiceItemId { get; set; }
    public string? ServiceItemName { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public long UnitPriceCents { get; set; }
    public long TotalPriceCents { get; set; }
}

public class CreateContractDto
{
    public Guid CustomerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ContractBillingType Type { get; set; } = ContractBillingType.FixedPrice;
    public long AmountCents { get; set; }
    public decimal? EstimatedHours { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Terms { get; set; }
    public List<CreateContractItemDto>? Items { get; set; }
}

public class CreateContractItemDto
{
    public Guid? ServiceItemId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public long UnitPriceCents { get; set; }
}

public class UpdateContractDto
{
    public Guid CustomerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ContractBillingType Type { get; set; }
    public long AmountCents { get; set; }
    public decimal? EstimatedHours { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Terms { get; set; }
}

public class UpdateContractStatusDto
{
    public ContractStatus Status { get; set; }
}

public class ContractFilterParams
{
    public string? Search { get; set; }
    public Guid? CustomerId { get; set; }
    public ContractBillingType? Type { get; set; }
    public ContractStatus? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SortBy { get; set; } = "title";
    public bool SortDescending { get; set; } = false;
}

public class ContractMetricsDto
{
    public int TotalContracts { get; set; }
    public int ActiveContracts { get; set; }
    public int DraftContracts { get; set; }
    public int CompletedContracts { get; set; }
    public long TotalActiveValueCents { get; set; }
    public long MonthlyRecurringRevenueCents { get; set; }
}

public class ContractAttachmentDto
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? StorageKeyOrUrl { get; set; }
    public string? Description { get; set; }
    public DateTime UploadedAtUtc { get; set; }
}

public class CreateContractAttachmentReferenceDto
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
    public long FileSizeBytes { get; set; }
    public string? StorageKeyOrUrl { get; set; }
    public string? Description { get; set; }
}
