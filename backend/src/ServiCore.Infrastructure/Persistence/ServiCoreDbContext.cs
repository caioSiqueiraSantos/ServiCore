using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence;

public class ServiCoreDbContext : DbContext, IAppDbContext
{
    private readonly ICurrentWorkspaceService? _currentWorkspaceService;

    public ServiCoreDbContext(
        DbContextOptions<ServiCoreDbContext> options,
        ICurrentWorkspaceService? currentWorkspaceService = null)
        : base(options)
    {
        _currentWorkspaceService = currentWorkspaceService;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplica todas as configurações fluentes de entidades da assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ServiCoreDbContext).Assembly);

        // Global Query Filter para isolamento multitenancy estrito por Workspace
        modelBuilder.Entity<Customer>().HasQueryFilter(c =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            c.WorkspaceId == _currentWorkspaceService.WorkspaceId.Value);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Atribui automaticamente o WorkspaceId do contexto autenticado a entidades IWorkspaceScoped novas
        if (_currentWorkspaceService?.WorkspaceId.HasValue == true)
        {
            var currentWsId = _currentWorkspaceService.WorkspaceId.Value;
            foreach (var entry in ChangeTracker.Entries<IWorkspaceScoped>())
            {
                if (entry.State == EntityState.Added && entry.Entity.WorkspaceId == Guid.Empty)
                {
                    entry.Entity.WorkspaceId = currentWsId;
                }
            }
        }

        // Atualiza carimbo de tempo UTC para entidades modificadas
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Modified:
                    entry.Entity.MarkAsUpdated();
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
