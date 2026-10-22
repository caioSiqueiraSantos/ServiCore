using ServiCore.Domain.Common;

namespace ServiCore.Domain.Entities;

/// <summary>
/// Representa a referência e metadados de anexos contratuais.
/// NOTA DE ARQUITETURA (SQLite vs. PostgreSQL Neon):
/// No SQLite local, para evitar locks, fragmentação e saturação de I/O em disco, armazenamos apenas
/// metadados estruturados e referências/URLs externas.
/// Ao migrar para PostgreSQL (Neon Database), a entidade está 100% preparada para integrar com 
/// Object Storage (Amazon S3, Cloudflare R2, Supabase Storage ou bytea nativo).
/// </summary>
public class ContractAttachment : BaseEntity, IWorkspaceScoped
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; private set; } = null!;

    public Guid ContractId { get; private set; }
    public Contract Contract { get; private set; } = null!;

    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = "application/octet-stream";
    public long FileSizeBytes { get; private set; }
    public string? StorageKeyOrUrl { get; private set; }
    public string? Description { get; private set; }
    public DateTime UploadedAtUtc { get; private set; } = DateTime.UtcNow;

    protected ContractAttachment() { }

    public ContractAttachment(
        Guid workspaceId,
        Guid contractId,
        string fileName,
        string contentType,
        long fileSizeBytes,
        string? storageKeyOrUrl = null,
        string? description = null)
    {
        if (workspaceId == Guid.Empty)
            throw new ArgumentException("O WorkspaceId é obrigatório.", nameof(workspaceId));

        if (contractId == Guid.Empty)
            throw new ArgumentException("O ContractId é obrigatório.", nameof(contractId));

        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("O nome do arquivo é obrigatório.", nameof(fileName));

        WorkspaceId = workspaceId;
        ContractId = contractId;
        FileName = fileName.Trim();
        ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType.Trim();
        FileSizeBytes = Math.Max(0, fileSizeBytes);
        StorageKeyOrUrl = storageKeyOrUrl?.Trim();
        Description = description?.Trim();
        UploadedAtUtc = DateTime.UtcNow;
    }
}
