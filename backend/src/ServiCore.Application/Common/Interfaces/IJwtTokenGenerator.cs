using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;

namespace ServiCore.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, Workspace workspace, MembershipRole role, out DateTime expiresAtUtc);
}
