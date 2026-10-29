namespace ServiCore.Application.Common.Interfaces;

public interface IAuditService
{
    Task LogAsync(string action, string entityName, string entityId, string? changesJson = null, CancellationToken cancellationToken = default);
}
