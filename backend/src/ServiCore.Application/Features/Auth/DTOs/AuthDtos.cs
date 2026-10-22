using ServiCore.Domain.Enums;

namespace ServiCore.Application.Features.Auth.DTOs;

public class RegisterRequestDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string WorkspaceName { get; set; } = string.Empty;
    public WorkspaceType WorkspaceType { get; set; } = WorkspaceType.Individual;
    public string? Document { get; set; }
}

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public UserSummaryDto User { get; set; } = null!;
    public WorkspaceSummaryDto ActiveWorkspace { get; set; } = null!;
    public List<WorkspaceSummaryDto> AvailableWorkspaces { get; set; } = new();
}

public class UserSummaryDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class WorkspaceSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public WorkspaceType Type { get; set; }
    public string? Document { get; set; }
    public MembershipRole Role { get; set; }
}

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public List<WorkspaceSummaryDto> Workspaces { get; set; } = new();
}

public class UpdateProfileDto
{
    public string FullName { get; set; } = string.Empty;
}

public class SwitchWorkspaceRequestDto
{
    public Guid WorkspaceId { get; set; }
}
