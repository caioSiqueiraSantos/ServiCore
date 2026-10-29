using ServiCore.Application.Common.Interfaces;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentWorkspaceService _currentWorkspaceService;

    public AuditService(
        IAppDbContext context,
        ICurrentWorkspaceService currentWorkspaceService)
    {
        _context = context;
        _currentWorkspaceService = currentWorkspaceService;
    }

    public async Task LogAsync(
        string action,
        string entityName,
        string entityId,
        string? changesJson = null,
        CancellationToken cancellationToken = default)
    {
        var log = new AuditLog(
            _currentWorkspaceService.WorkspaceId,
            _currentWorkspaceService.UserId,
            action,
            entityName,
            entityId,
            changesJson
        );

        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
