using ServiCore.Application.Common.Interfaces;

namespace ServiCore.Infrastructure.Services;

/// <summary>
/// Implementação controlada para SQLite onde uploads binários estão inativos por restrição de arquitetura.
/// Notifica educadamente caso chamada direta ocorra, mantendo a aplicação preparada para PostgreSQL (Neon Database).
/// </summary>
public class NullStorageService : IStorageService
{
    public bool IsStorageEnabled => false;

    public Task<string> UploadAsync(string fileName, Stream stream, string contentType, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException(
            "O upload de arquivos binários está desabilitado na fase SQLite. " +
            "A persistência de anexos será ativada com a migração para PostgreSQL (Neon Database) e Object Storage."
        );
    }

    public Task<Stream?> DownloadAsync(string storageKeyOrUrl, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<Stream?>(null);
    }

    public Task DeleteAsync(string storageKeyOrUrl, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public string GetDownloadUrl(string storageKeyOrUrl)
    {
        return storageKeyOrUrl;
    }
}
