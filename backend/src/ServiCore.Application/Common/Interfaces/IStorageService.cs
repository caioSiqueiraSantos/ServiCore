namespace ServiCore.Application.Common.Interfaces;

/// <summary>
/// Abstração de armazenamento de arquivos e anexos.
/// ARQUITETURA DE MIGRAÇÃO:
/// Em ambiente SQLite, uploads binários estão desabilitados para manter o banco leve, rápido e sem dependência
/// de caminhos de arquivos locais ou locks de I/O em desenvolvimento.
/// Ao migrar para PostgreSQL (Neon Database), basta registrar uma implementação concreta de IStorageService
/// que direcione para Amazon S3, Cloudflare R2 ou Supabase Storage, sem alterar a lógica de negócios da aplicação.
/// </summary>
public interface IStorageService
{
    bool IsStorageEnabled { get; }
    Task<string> UploadAsync(string fileName, Stream stream, string contentType, CancellationToken cancellationToken = default);
    Task<Stream?> DownloadAsync(string storageKeyOrUrl, CancellationToken cancellationToken = default);
    Task DeleteAsync(string storageKeyOrUrl, CancellationToken cancellationToken = default);
    string GetDownloadUrl(string storageKeyOrUrl);
}
