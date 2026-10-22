using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiCore.Domain.Entities;

namespace ServiCore.Infrastructure.Persistence.Configurations;

public class ContractAttachmentConfiguration : IEntityTypeConfiguration<ContractAttachment>
{
    public void Configure(EntityTypeBuilder<ContractAttachment> builder)
    {
        builder.ToTable("ContractAttachments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.WorkspaceId)
            .IsRequired();

        builder.Property(a => a.ContractId)
            .IsRequired();

        builder.Property(a => a.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(a => a.ContentType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.StorageKeyOrUrl)
            .HasMaxLength(1000);

        builder.Property(a => a.Description)
            .HasColumnType("TEXT");

        builder.Property(a => a.UploadedAtUtc)
            .IsRequired();

        builder.HasOne(a => a.Workspace)
            .WithMany()
            .HasForeignKey(a => a.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Contract)
            .WithMany(c => c.Attachments)
            .HasForeignKey(a => a.ContractId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.WorkspaceId);
        builder.HasIndex(a => a.ContractId);
    }
}
