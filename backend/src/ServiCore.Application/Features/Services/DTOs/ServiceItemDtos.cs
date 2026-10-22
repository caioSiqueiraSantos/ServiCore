using ServiCore.Domain.Enums;

namespace ServiCore.Application.Features.Services.DTOs;

public class ServiceItemDto
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long DefaultPriceCents { get; set; }
    public decimal DefaultPriceDecimal => DefaultPriceCents / 100m;
    public ServiceBillingUnit BillingUnit { get; set; }
    public decimal? EstimatedHours { get; set; }
    public ServiceStatus Status { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public class CreateServiceItemDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long DefaultPriceCents { get; set; }
    public ServiceBillingUnit BillingUnit { get; set; } = ServiceBillingUnit.Hour;
    public decimal? EstimatedHours { get; set; }
}

public class UpdateServiceItemDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long DefaultPriceCents { get; set; }
    public ServiceBillingUnit BillingUnit { get; set; }
    public decimal? EstimatedHours { get; set; }
    public ServiceStatus Status { get; set; } = ServiceStatus.Active;
}

public class ServiceItemFilterParams
{
    public string? Search { get; set; }
    public ServiceStatus? Status { get; set; }
    public ServiceBillingUnit? BillingUnit { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SortBy { get; set; } = "name";
    public bool SortDescending { get; set; } = false;
}
