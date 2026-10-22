namespace ServiCore.Domain.Common;

/// <summary>
/// Contrato para entidades que pertencem a um workspace e devem possuir isolamento de dados estrito.
/// </summary>
public interface IWorkspaceScoped
{
    Guid WorkspaceId { get; set; }
}
