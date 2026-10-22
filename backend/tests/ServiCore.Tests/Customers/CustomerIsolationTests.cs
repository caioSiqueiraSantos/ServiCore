using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Domain.Entities;
using ServiCore.Domain.Enums;
using ServiCore.Infrastructure.Persistence;
using Xunit;

namespace ServiCore.Tests.Customers;

public class TestWorkspaceService : ICurrentWorkspaceService
{
    public Guid? WorkspaceId { get; set; }
    public Guid? UserId { get; set; }
}

public class CustomerIsolationTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly DbContextOptions<ServiCoreDbContext> _options;
    private readonly TestWorkspaceService _workspaceService;

    public CustomerIsolationTests()
    {
        _connection = new SqliteConnection("Filename=:memory:");
        _connection.Open();

        _options = new DbContextOptionsBuilder<ServiCoreDbContext>()
            .UseSqlite(_connection)
            .Options;

        _workspaceService = new TestWorkspaceService();

        using var initContext = new ServiCoreDbContext(_options, null);
        initContext.Database.EnsureCreated();
    }

    [Fact]
    public async Task QueryFilter_ShouldStrictlyIsolateCustomersBetweenWorkspaces()
    {
        // Arrange
        var wsA = new Workspace("Workspace Alpha", WorkspaceType.Individual);
        var wsB = new Workspace("Workspace Beta", WorkspaceType.Enterprise);

        using (var setupContext = new ServiCoreDbContext(_options, null))
        {
            setupContext.Workspaces.AddRange(wsA, wsB);
            await setupContext.SaveChangesAsync();

            var custA = new Customer(wsA.Id, "Cliente do Alpha", CustomerType.Individual, "11122233344");
            var custB = new Customer(wsB.Id, "Cliente do Beta", CustomerType.Company, "22233344455");

            setupContext.Customers.AddRange(custA, custB);
            await setupContext.SaveChangesAsync();
        }

        // Act 1: Contexto sob o Workspace Alpha
        _workspaceService.WorkspaceId = wsA.Id;
        using (var contextAlpha = new ServiCoreDbContext(_options, _workspaceService))
        {
            var alphaCustomers = await contextAlpha.Customers.ToListAsync();
            
            // Assert 1: Apenas o cliente do Alpha deve ser visível
            Assert.Single(alphaCustomers);
            Assert.Equal("Cliente do Alpha", alphaCustomers[0].Name);

            // Tentar acessar diretamente pelo ID do cliente do Workspace Beta deve retornar nulo (IDOR Safe)
            var customerB = await contextAlpha.Customers.FirstOrDefaultAsync(c => c.Name == "Cliente do Beta");
            Assert.Null(customerB);
        }

        // Act 2: Contexto sob o Workspace Beta
        _workspaceService.WorkspaceId = wsB.Id;
        using (var contextBeta = new ServiCoreDbContext(_options, _workspaceService))
        {
            var betaCustomers = await contextBeta.Customers.ToListAsync();

            // Assert 2: Apenas o cliente do Beta deve ser visível
            Assert.Single(betaCustomers);
            Assert.Equal("Cliente do Beta", betaCustomers[0].Name);
        }
    }

    public void Dispose()
    {
        _connection.Dispose();
    }
}
