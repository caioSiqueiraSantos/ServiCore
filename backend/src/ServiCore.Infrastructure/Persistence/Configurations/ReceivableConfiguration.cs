using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence.Configurations;

public class ReceivableConfiguration : IEntityTypeConfiguration<Receivable>
{
    public void Configure(EntityTypeBuilder<Receivable> builder)
    {
        builder.ToTable("Receivables");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.WorkspaceId)
            .IsRequired();

        builder.Property(r => r.CustomerId)
            .IsRequired();

        builder.Property(r => r.ContractId)
            .IsRequired(false);

        builder.Property(r => r.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.Description)
            .HasColumnType("TEXT");

        builder.Property(r => r.Category)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(r => r.Amount)
            .HasConversion(
                m => m.Cents,
                c => new Money(c))
            .IsRequired();

        builder.Property(r => r.PaidAmount)
            .HasConversion(
                m => m.Cents,
                c => new Money(c))
            .IsRequired();

        builder.Ignore(r => r.RemainingAmount);

        builder.Property(r => r.DueDate)
            .IsRequired();

        builder.Property(r => r.IssueDate)
            .IsRequired();

        builder.Property(r => r.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(r => r.Notes)
            .HasColumnType("TEXT");

        builder.Property(r => r.CreatedAtUtc)
            .IsRequired();

        // Relacionamentos
        builder.HasOne(r => r.Workspace)
            .WithMany()
            .HasForeignKey(r => r.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Customer)
            .WithMany()
            .HasForeignKey(r => r.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Contract)
            .WithMany()
            .HasForeignKey(r => r.ContractId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(r => r.Payments)
            .WithOne(p => p.Receivable)
            .HasForeignKey(p => p.ReceivableId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => new { r.WorkspaceId, r.Status });
        builder.HasIndex(r => new { r.WorkspaceId, r.CustomerId });
        builder.HasIndex(r => new { r.WorkspaceId, r.DueDate });
    }
}
