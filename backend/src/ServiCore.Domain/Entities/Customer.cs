using ServiCore.Domain.Common;
using ServiCore.Domain.Enums;

namespace ServiCore.Domain.Entities;

public class Customer : BaseEntity, IWorkspaceScoped
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; private set; } = null!;

    public CustomerType Type { get; private set; } = CustomerType.Individual;
    public string Name { get; private set; } = string.Empty;
    public string? Document { get; private set; } // CPF (11 dígitos) ou CNPJ (14 dígitos)
    public string? Email { get; private set; }
    public string? Phone { get; private set; }
    public string? Notes { get; private set; }
    public CustomerStatus Status { get; private set; } = CustomerStatus.Active;

    // Construtor protegido para o EF Core
    protected Customer() { }

    public Customer(
        Guid workspaceId,
        string name,
        CustomerType type,
        string? document = null,
        string? email = null,
        string? phone = null,
        string? notes = null)
    {
        if (workspaceId == Guid.Empty)
            throw new ArgumentException("O WorkspaceId é obrigatório para o cadastro de cliente.", nameof(workspaceId));

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("O nome do cliente é obrigatório.", nameof(name));

        WorkspaceId = workspaceId;
        Name = name.Trim();
        Type = type;
        Document = NormalizeDocument(document);
        Email = NormalizeEmail(email);
        Phone = NormalizePhone(phone);
        Notes = notes?.Trim();
        Status = CustomerStatus.Active;
    }

    public void Update(
        string name,
        CustomerType type,
        string? document,
        string? email,
        string? phone,
        string? notes)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("O nome do cliente é obrigatório.", nameof(name));

        Name = name.Trim();
        Type = type;
        Document = NormalizeDocument(document);
        Email = NormalizeEmail(email);
        Phone = NormalizePhone(phone);
        Notes = notes?.Trim();
        MarkAsUpdated();
    }

    public void Deactivate()
    {
        Status = CustomerStatus.Inactive;
        MarkAsUpdated();
    }

    public void Activate()
    {
        Status = CustomerStatus.Active;
        MarkAsUpdated();
    }

    private static string? NormalizeDocument(string? doc)
    {
        if (string.IsNullOrWhiteSpace(doc)) return null;
        var clean = new string(doc.Where(char.IsDigit).ToArray());
        return string.IsNullOrEmpty(clean) ? null : clean;
    }

    private static string? NormalizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;
        return email.Trim().ToLowerInvariant();
    }

    private static string? NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return null;
        return phone.Trim();
    }
}
