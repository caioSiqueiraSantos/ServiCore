using ServiCore.Domain.Common;
using ServiCore.Domain.Enums;

namespace ServiCore.Domain.Entities;

public class Membership : BaseEntity, IWorkspaceScoped
{
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; private set; } = null!;

    public MembershipRole Role { get; private set; } = MembershipRole.Member;
    public DateTime JoinedAtUtc { get; private set; } = DateTime.UtcNow;

    protected Membership() { }

    public Membership(Guid userId, Guid workspaceId, MembershipRole role)
    {
        UserId = userId;
        WorkspaceId = workspaceId;
        Role = role;
        JoinedAtUtc = DateTime.UtcNow;
    }

    public void ChangeRole(MembershipRole newRole)
    {
        Role = newRole;
        MarkAsUpdated();
    }
}
