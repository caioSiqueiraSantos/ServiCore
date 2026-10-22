using ServiCore.Domain.Common;
using ServiCore.Domain.Enums;

namespace ServiCore.Domain.Entities;

public class Workspace : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Document { get; private set; } // CPF ou CNPJ
    public WorkspaceType Type { get; private set; } = WorkspaceType.Individual;

    public ICollection<Membership> Memberships { get; private set; } = new List<Membership>();

    protected Workspace() { }

    public Workspace(string name, WorkspaceType type, string? document = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("O nome do workspace é obrigatório.", nameof(name));

        Name = name.Trim();
        Type = type;
        Document = NormalizeDocument(document);
    }

    public void Update(string name, WorkspaceType type, string? document = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("O nome do workspace é obrigatório.", nameof(name));

        Name = name.Trim();
        Type = type;
        Document = NormalizeDocument(document);
        MarkAsUpdated();
    }

    private static string? NormalizeDocument(string? doc)
    {
        if (string.IsNullOrWhiteSpace(doc)) return null;
        var clean = new string(doc.Where(char.IsDigit).ToArray());
        return string.IsNullOrEmpty(clean) ? null : clean;
    }
}
