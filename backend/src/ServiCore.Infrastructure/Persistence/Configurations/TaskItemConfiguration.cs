using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence.Configurations;

public class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("Tasks");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.WorkspaceId)
            .IsRequired();

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Description)
            .HasColumnType("TEXT");

        builder.Property(t => t.Priority)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(t => t.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(t => t.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(t => t.Workspace)
            .WithMany()
            .HasForeignKey(t => t.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.Customer)
            .WithMany()
            .HasForeignKey(t => t.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.Contract)
            .WithMany(c => c.Tasks)
            .HasForeignKey(t => t.ContractId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.ServiceItem)
            .WithMany()
            .HasForeignKey(t => t.ServiceItemId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(t => t.WorkspaceId);
        builder.HasIndex(t => new { t.WorkspaceId, t.Status });
        builder.HasIndex(t => new { t.WorkspaceId, t.DueDate });
        builder.HasIndex(t => new { t.WorkspaceId, t.CustomerId });
        builder.HasIndex(t => new { t.WorkspaceId, t.ContractId });
    }
}
