using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence.Configurations;

public class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.ToTable("Expenses");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.WorkspaceId)
            .IsRequired();

        builder.Property(e => e.Description)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Category)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(e => e.Amount)
            .HasConversion(
                m => m.Cents,
                c => new Money(c))
            .IsRequired();

        builder.Property(e => e.DueDate)
            .IsRequired();

        builder.Property(e => e.PaymentDate)
            .IsRequired(false);

        builder.Property(e => e.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(e => e.PaymentMethod)
            .IsRequired(false)
            .HasConversion<int>();

        builder.Property(e => e.Supplier)
            .HasMaxLength(150);

        builder.Property(e => e.Notes)
            .HasColumnType("TEXT");

        builder.Property(e => e.CreatedAtUtc)
            .IsRequired();

        // Relacionamentos
        builder.HasOne(e => e.Workspace)
            .WithMany()
            .HasForeignKey(e => e.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.WorkspaceId, e.Status });
        builder.HasIndex(e => new { e.WorkspaceId, e.DueDate });
        builder.HasIndex(e => new { e.WorkspaceId, e.Category });
    }
}
