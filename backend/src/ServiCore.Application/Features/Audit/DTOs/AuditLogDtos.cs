namespace ServiCore.Application.Features.Audit.DTOs;

public record AuditLogDto(
    Guid Id,
    Guid? WorkspaceId,
    Guid? UserId,
    string? UserFullName,
    string Action,
    string EntityName,
    string EntityId,
    string? ChangesJson,
    DateTime TimestampUtc
);
