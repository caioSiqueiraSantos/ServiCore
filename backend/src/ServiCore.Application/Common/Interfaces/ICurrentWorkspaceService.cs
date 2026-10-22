namespace ServiCore.Application.Common.Interfaces;

/// <summary>
/// Fornece o contexto atual da requisição para isolamento multitenancy por workspace.
/// </summary>
public interface ICurrentWorkspaceService
{
    Guid? WorkspaceId { get; }
    Guid? UserId { get; }
}
