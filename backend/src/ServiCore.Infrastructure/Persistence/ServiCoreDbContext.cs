using Microsoft.EntityFrameworkCore;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence;

/// <summary>
/// DbContext principal da aplicação ServiCore.
/// PREPARAÇÃO PARA MIGRAÇÃO POSTGRESQL (NEON DATABASE):
/// Toda a modelagem do ServiCoreDbContext foi projetada de forma estritamente compatível tanto com SQLite
/// quanto com PostgreSQL (Npgsql).
/// Ao migrar para a nuvem Neon:
/// 1. Instalar o pacote 'Npgsql.EntityFrameworkCore.PostgreSQL'.
/// 2. Alterar em DependencyInjection 'options.UseSqlite(...)' para 'options.UseNpgsql(neonConnectionString)'.
/// 3. Todas as conversões de tipos (Money -> long, Enums -> int, DateTime -> UTC, TEXT para notas) são nativas no Postgres.
/// 4. O isolamento multitenancy via Global Query Filter funciona identicamente no PostgreSQL.
/// </summary>
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
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<ContractItem> ContractItems => Set<ContractItem>();
    public DbSet<ServiceItem> Services => Set<ServiceItem>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<ContractAttachment> ContractAttachments => Set<ContractAttachment>();
    public DbSet<Receivable> Receivables => Set<Receivable>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Expense> Expenses => Set<Expense>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplica todas as configurações fluentes de entidades da assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ServiCoreDbContext).Assembly);

        // Global Query Filters para isolamento multitenancy estrito por Workspace
        modelBuilder.Entity<Customer>().HasQueryFilter(c =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            c.WorkspaceId == _currentWorkspaceService.WorkspaceId);

        modelBuilder.Entity<Contract>().HasQueryFilter(c =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            c.WorkspaceId == _currentWorkspaceService.WorkspaceId);

        modelBuilder.Entity<ContractItem>().HasQueryFilter(i =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            i.Contract.WorkspaceId == _currentWorkspaceService.WorkspaceId);

        modelBuilder.Entity<ServiceItem>().HasQueryFilter(s =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            s.WorkspaceId == _currentWorkspaceService.WorkspaceId);

        modelBuilder.Entity<TaskItem>().HasQueryFilter(t =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            t.WorkspaceId == _currentWorkspaceService.WorkspaceId);

        modelBuilder.Entity<CalendarEvent>().HasQueryFilter(e =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            e.WorkspaceId == _currentWorkspaceService.WorkspaceId);

        modelBuilder.Entity<ContractAttachment>().HasQueryFilter(a =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            a.WorkspaceId == _currentWorkspaceService.WorkspaceId);

        modelBuilder.Entity<Receivable>().HasQueryFilter(r =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            r.WorkspaceId == _currentWorkspaceService.WorkspaceId);

        modelBuilder.Entity<Payment>().HasQueryFilter(p =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            p.WorkspaceId == _currentWorkspaceService.WorkspaceId);

        modelBuilder.Entity<Expense>().HasQueryFilter(e =>
            _currentWorkspaceService == null ||
            !_currentWorkspaceService.WorkspaceId.HasValue ||
            e.WorkspaceId == _currentWorkspaceService.WorkspaceId);
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
