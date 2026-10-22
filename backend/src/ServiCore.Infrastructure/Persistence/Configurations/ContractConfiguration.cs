using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence.Configurations;

public class ContractConfiguration : IEntityTypeConfiguration<Contract>
{
    public void Configure(EntityTypeBuilder<Contract> builder)
    {
        builder.ToTable("Contracts");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.WorkspaceId)
            .IsRequired();

        builder.Property(c => c.CustomerId)
            .IsRequired();

        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Description)
            .HasColumnType("TEXT");

        builder.Property(c => c.Terms)
            .HasColumnType("TEXT");

        builder.Property(c => c.Amount)
            .HasConversion(
                m => m.Cents,
                c => new Money(c))
            .IsRequired();

        builder.Property(c => c.Type)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(c => c.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(c => c.EstimatedHours)
            .HasPrecision(10, 2);

        builder.Property(c => c.StartDate)
            .IsRequired();

        builder.Property(c => c.CreatedAtUtc)
            .IsRequired();

        // Relacionamentos
        builder.HasOne(c => c.Workspace)
            .WithMany()
            .HasForeignKey(c => c.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Customer)
            .WithMany()
            .HasForeignKey(c => c.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Items)
            .WithOne(i => i.Contract)
            .HasForeignKey(i => i.ContractId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Tasks)
            .WithOne(t => t.Contract)
            .HasForeignKey(t => t.ContractId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(c => c.Attachments)
            .WithOne(a => a.Contract)
            .HasForeignKey(a => a.ContractId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índices otimizados para busca multitenancy
        builder.HasIndex(c => c.WorkspaceId);
        builder.HasIndex(c => new { c.WorkspaceId, c.CustomerId });
        builder.HasIndex(c => new { c.WorkspaceId, c.Status });
        builder.HasIndex(c => new { c.WorkspaceId, c.StartDate });
    }
}
