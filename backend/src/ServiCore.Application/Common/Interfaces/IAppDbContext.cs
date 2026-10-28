using Microsoft.EntityFrameworkCore;
using ServiCore.Domain.Entities;

namespace ServiCore.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Workspace> Workspaces { get; }
    DbSet<Membership> Memberships { get; }
    DbSet<Customer> Customers { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Contract> Contracts { get; }
    DbSet<ContractItem> ContractItems { get; }
    DbSet<ServiceItem> Services { get; }
    DbSet<TaskItem> Tasks { get; }
    DbSet<CalendarEvent> CalendarEvents { get; }
    DbSet<ContractAttachment> ContractAttachments { get; }
    DbSet<Receivable> Receivables { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Expense> Expenses { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

