using ServiCore.Domain.Common;

namespace ServiCore.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid? WorkspaceId { get; private set; }
    public Guid? UserId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string EntityName { get; private set; } = string.Empty;
    public string EntityId { get; private set; } = string.Empty;
    public string? ChangesJson { get; private set; }
    public DateTime TimestampUtc { get; private set; } = DateTime.UtcNow;

    protected AuditLog() { }

    public AuditLog(Guid? workspaceId, Guid? userId, string action, string entityName, string entityId, string? changesJson = null)
    {
        WorkspaceId = workspaceId;
        UserId = userId;
        Action = action;
        EntityName = entityName;
        EntityId = entityId;
        ChangesJson = changesJson;
        TimestampUtc = DateTime.UtcNow;
    }
}
