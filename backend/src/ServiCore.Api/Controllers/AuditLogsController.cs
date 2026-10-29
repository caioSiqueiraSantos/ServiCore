using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Application.Common.Models;
using ServiCore.Application.Features.Audit.DTOs;

namespace ServiCore.Api.Controllers;

[Authorize]
public class AuditLogsController : ApiControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentWorkspaceService _currentWorkspaceService;

    public AuditLogsController(
        IAppDbContext context,
        ICurrentWorkspaceService currentWorkspaceService)
    {
        _context = context;
        _currentWorkspaceService = currentWorkspaceService;
    }

    /// <summary>
    /// Lista os registros de auditoria do workspace com suporte a filtros e paginação.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<AuditLogDto>>>> GetAuditLogs(
        [FromQuery] string? entityName,
        [FromQuery] string? action,
        [FromQuery] int limit = 50)
    {
        var workspaceId = _currentWorkspaceService.WorkspaceId;
        if (!workspaceId.HasValue)
            return Unauthorized(ApiResponse<List<AuditLogDto>>.Fail("Workspace não identificado."));

        var query = _context.AuditLogs
            .Where(a => a.WorkspaceId == workspaceId.Value)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(entityName))
            query = query.Where(a => a.EntityName.ToLower() == entityName.Trim().ToLower());

        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(a => a.Action.ToLower() == action.Trim().ToLower());

        var logs = await query
            .OrderByDescending(a => a.TimestampUtc)
            .Take(Math.Min(limit, 100))
            .ToListAsync();

        var userIds = logs.Where(l => l.UserId.HasValue).Select(l => l.UserId!.Value).Distinct().ToList();
        var usersMap = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName);

        var dtos = logs.Select(l => new AuditLogDto(
            l.Id,
            l.WorkspaceId,
            l.UserId,
            l.UserId.HasValue && usersMap.TryGetValue(l.UserId.Value, out var name) ? name : "Sistema",
            l.Action,
            l.EntityName,
            l.EntityId,
            l.ChangesJson,
            l.TimestampUtc
        )).ToList();

        return Ok(ApiResponse<List<AuditLogDto>>.Ok(dtos, $"{dtos.Count} registros de auditoria carregados."));
    }
}
