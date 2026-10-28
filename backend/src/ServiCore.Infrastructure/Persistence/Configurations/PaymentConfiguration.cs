using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.WorkspaceId)
            .IsRequired();

        builder.Property(p => p.ReceivableId)
            .IsRequired();

        builder.Property(p => p.Amount)
            .HasConversion(
                m => m.Cents,
                c => new Money(c))
            .IsRequired();

        builder.Property(p => p.PaymentDate)
            .IsRequired();

        builder.Property(p => p.Method)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(p => p.TransactionReference)
            .HasMaxLength(150);

        builder.Property(p => p.IdempotencyKey)
            .HasMaxLength(100);

        builder.Property(p => p.Notes)
            .HasColumnType("TEXT");

        builder.Property(p => p.CreatedAtUtc)
            .IsRequired();

        // Relacionamentos
        builder.HasOne(p => p.Workspace)
            .WithMany()
            .HasForeignKey(p => p.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Receivable)
            .WithMany(r => r.Payments)
            .HasForeignKey(p => p.ReceivableId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => new { p.WorkspaceId, p.PaymentDate });
        builder.HasIndex(p => new { p.WorkspaceId, p.IdempotencyKey });
    }
}
