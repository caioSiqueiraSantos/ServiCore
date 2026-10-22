using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence.Configurations;

public class ContractItemConfiguration : IEntityTypeConfiguration<ContractItem>
{
    public void Configure(EntityTypeBuilder<ContractItem> builder)
    {
        builder.ToTable("ContractItems");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.ContractId)
            .IsRequired();

        builder.Property(i => i.Description)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(i => i.Quantity)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.Property(i => i.UnitPrice)
            .HasConversion(
                m => m.Cents,
                c => new Money(c))
            .IsRequired();

        builder.Property(i => i.TotalPrice)
            .HasConversion(
                m => m.Cents,
                c => new Money(c))
            .IsRequired();

        builder.Property(i => i.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(i => i.Contract)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.ContractId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.ServiceItem)
            .WithMany()
            .HasForeignKey(i => i.ServiceItemId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(i => i.ContractId);
    }
}
