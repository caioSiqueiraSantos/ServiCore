using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiCore.Domain.Common;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence.Configurations;

public class ServiceItemConfiguration : IEntityTypeConfiguration<ServiceItem>
{
    public void Configure(EntityTypeBuilder<ServiceItem> builder)
    {
        builder.ToTable("Services");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.WorkspaceId)
            .IsRequired();

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(s => s.Description)
            .HasColumnType("TEXT");

        builder.Property(s => s.DefaultPrice)
            .HasConversion(
                m => m.Cents,
                c => new Money(c))
            .IsRequired();

        builder.Property(s => s.BillingUnit)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(s => s.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(s => s.EstimatedHours)
            .HasPrecision(10, 2);

        builder.Property(s => s.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(s => s.Workspace)
            .WithMany()
            .HasForeignKey(s => s.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.WorkspaceId);
        builder.HasIndex(s => new { s.WorkspaceId, s.Name });
        builder.HasIndex(s => new { s.WorkspaceId, s.Status });
    }
}
