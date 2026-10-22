using ServiCore.Domain.Enums;

namespace ServiCore.Application.Features.Calendar.DTOs;

public class CalendarEventDto
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LocationOrLink { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public CalendarEventType Type { get; set; }
    public CalendarEventStatus Status { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public Guid? ContractId { get; set; }
    public string? ContractTitle { get; set; }
    public Guid? TaskItemId { get; set; }
    public string? TaskItemTitle { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateCalendarEventDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LocationOrLink { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public CalendarEventType Type { get; set; } = CalendarEventType.Meeting;
    public Guid? CustomerId { get; set; }
    public Guid? ContractId { get; set; }
    public Guid? TaskItemId { get; set; }
}

public class UpdateCalendarEventDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LocationOrLink { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public CalendarEventType Type { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? ContractId { get; set; }
    public Guid? TaskItemId { get; set; }
}

public class CalendarEventFilterParams
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public CalendarEventType? Type { get; set; }
    public Guid? CustomerId { get; set; }
    public bool IncludeTaskDeadlines { get; set; } = true;
}
