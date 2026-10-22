using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using ServiCore.Application.Common.Interfaces;

namespace ServiCore.Infrastructure.Services;

public class CurrentWorkspaceService : ICurrentWorkspaceService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentWorkspaceService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? WorkspaceId
    {
        get
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            // Prioridade 1: Header explícito X-Workspace-Id
            if (context.Request.Headers.TryGetValue("X-Workspace-Id", out var headerValue) &&
                Guid.TryParse(headerValue.ToString(), out var workspaceIdFromHeader))
            {
                return workspaceIdFromHeader;
            }

            // Prioridade 2: Claims do usuário autenticado
            var claimValue = context.User?.FindFirst("workspace_id")?.Value;
            if (!string.IsNullOrEmpty(claimValue) && Guid.TryParse(claimValue, out var workspaceIdFromClaim))
            {
                return workspaceIdFromClaim;
            }

            return null;
        }
    }

    public Guid? UserId
    {
        get
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return null;

            var claimValue = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                             context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(claimValue) && Guid.TryParse(claimValue, out var userId))
            {
                return userId;
            }

            return null;
        }
    }
}
