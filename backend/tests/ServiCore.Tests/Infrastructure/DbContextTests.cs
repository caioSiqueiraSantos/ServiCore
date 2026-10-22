using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using ServiCore.Infrastructure.Persistence;
using Xunit;

namespace ServiCore.Tests.Infrastructure;

public class DbContextTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<ServiCoreDbContext> _options;

    public DbContextTests()
    {
        // Cria conexão SQLite em memória aberta para manter o esquema ativo durante o teste
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<ServiCoreDbContext>()
            .UseSqlite(_connection)
            .Options;

        using var context = new ServiCoreDbContext(_options);
        context.Database.EnsureCreated();
    }

    [Fact]
    public async Task CanPersistUserAndWorkspaceWithMembership()
    {
        // Arrange
        using var context = new ServiCoreDbContext(_options);

        var user = new User("Mariana Souza", "mariana@consultoria.com", "secure_hash");
        var workspace = new Workspace("Mariana Consultoria", WorkspaceType.Individual, "123.456.789-00");
        var membership = new Membership(user.Id, workspace.Id, MembershipRole.Owner);

        context.Users.Add(user);
        context.Workspaces.Add(workspace);
        context.Memberships.Add(membership);

        // Act
        var savedCount = await context.SaveChangesAsync();

        // Assert
        Assert.True(savedCount >= 3);

        using var assertContext = new ServiCoreDbContext(_options);
        var persistedUser = await assertContext.Users
            .Include(u => u.Memberships)
            .FirstOrDefaultAsync(u => u.Id == user.Id);

        Assert.NotNull(persistedUser);
        Assert.Equal("mariana@consultoria.com", persistedUser.Email);
        Assert.Single(persistedUser.Memberships);
        Assert.Equal(workspace.Id, persistedUser.Memberships.First().WorkspaceId);
        Assert.Equal(MembershipRole.Owner, persistedUser.Memberships.First().Role);
    }

    public void Dispose()
    {
        _connection.Dispose();
    }
}
