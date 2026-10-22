using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence.Configurations;

public class CalendarEventConfiguration : IEntityTypeConfiguration<CalendarEvent>
{
    public void Configure(EntityTypeBuilder<CalendarEvent> builder)
    {
        builder.ToTable("CalendarEvents");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.WorkspaceId)
            .IsRequired();

        builder.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasColumnType("TEXT");

        builder.Property(e => e.LocationOrLink)
            .HasMaxLength(500);

        builder.Property(e => e.Type)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(e => e.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(e => e.StartTimeUtc)
            .IsRequired();

        builder.Property(e => e.EndTimeUtc)
            .IsRequired();

        builder.Property(e => e.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(e => e.Workspace)
            .WithMany()
            .HasForeignKey(e => e.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.Contract)
            .WithMany()
            .HasForeignKey(e => e.ContractId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.TaskItem)
            .WithMany()
            .HasForeignKey(e => e.TaskItemId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.WorkspaceId);
        builder.HasIndex(e => new { e.WorkspaceId, e.StartTimeUtc });
        builder.HasIndex(e => new { e.WorkspaceId, e.EndTimeUtc });
        builder.HasIndex(e => new { e.WorkspaceId, e.Status });
    }
}
