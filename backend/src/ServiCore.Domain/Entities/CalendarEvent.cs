using ServiCore.Domain.Common;
using ServiCore.Domain.Enums;

namespace ServiCore.Domain.Entities;

public class CalendarEvent : BaseEntity, IWorkspaceScoped
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; private set; } = null!;

    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? LocationOrLink { get; private set; }

    public DateTime StartTimeUtc { get; private set; }
    public DateTime EndTimeUtc { get; private set; }

    public CalendarEventType Type { get; private set; } = CalendarEventType.Meeting;
    public CalendarEventStatus Status { get; private set; } = CalendarEventStatus.Scheduled;

    public Guid? CustomerId { get; private set; }
    public Customer? Customer { get; private set; }

    public Guid? ContractId { get; private set; }
    public Contract? Contract { get; private set; }

    public Guid? TaskItemId { get; private set; }
    public TaskItem? TaskItem { get; private set; }

    protected CalendarEvent() { }

    public CalendarEvent(
        Guid workspaceId,
        string title,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        CalendarEventType type = CalendarEventType.Meeting,
        string? description = null,
        string? locationOrLink = null,
        Guid? customerId = null,
        Guid? contractId = null,
        Guid? taskItemId = null)
    {
        if (workspaceId == Guid.Empty)
            throw new ArgumentException("O WorkspaceId é obrigatório.", nameof(workspaceId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("O título do compromisso é obrigatório.", nameof(title));

        if (endTimeUtc < startTimeUtc)
            throw new ArgumentException("O término do evento não pode ser anterior ao início.", nameof(endTimeUtc));

        WorkspaceId = workspaceId;
        Title = title.Trim();
        StartTimeUtc = startTimeUtc;
        EndTimeUtc = endTimeUtc;
        Type = type;
        Description = description?.Trim();
        LocationOrLink = locationOrLink?.Trim();
        CustomerId = customerId;
        ContractId = contractId;
        TaskItemId = taskItemId;
        Status = CalendarEventStatus.Scheduled;
    }

    public void Update(
        string title,
        DateTime startTimeUtc,
        DateTime endTimeUtc,
        CalendarEventType type,
        string? description,
        string? locationOrLink,
        Guid? customerId,
        Guid? contractId,
        Guid? taskItemId)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("O título do compromisso é obrigatório.", nameof(title));

        if (endTimeUtc < startTimeUtc)
            throw new ArgumentException("O término do evento não pode ser anterior ao início.", nameof(endTimeUtc));

        Title = title.Trim();
        StartTimeUtc = startTimeUtc;
        EndTimeUtc = endTimeUtc;
        Type = type;
        Description = description?.Trim();
        LocationOrLink = locationOrLink?.Trim();
        CustomerId = customerId;
        ContractId = contractId;
        TaskItemId = taskItemId;
        MarkAsUpdated();
    }

    public void Complete()
    {
        Status = CalendarEventStatus.Completed;
        MarkAsUpdated();
    }

    public void Cancel()
    {
        Status = CalendarEventStatus.Cancelled;
        MarkAsUpdated();
    }

    public void Reschedule(DateTime newStartTimeUtc, DateTime newEndTimeUtc)
    {
        if (newEndTimeUtc < newStartTimeUtc)
            throw new ArgumentException("O término do evento não pode ser anterior ao início.", nameof(newEndTimeUtc));

        StartTimeUtc = newStartTimeUtc;
        EndTimeUtc = newEndTimeUtc;
        MarkAsUpdated();
    }
}
