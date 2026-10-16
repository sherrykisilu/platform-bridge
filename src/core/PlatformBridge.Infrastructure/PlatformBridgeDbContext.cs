using Microsoft.EntityFrameworkCore;
using PlatformBridge.Domain;

namespace PlatformBridge.Infrastructure;

public sealed class PlatformBridgeDbContext(DbContextOptions<PlatformBridgeDbContext> options)
    : DbContext(options)
{
    public DbSet<PlatformEventRecord> PlatformEvents => Set<PlatformEventRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<PlatformEventRecord>();
        entity.HasKey(item => item.EventId);
        entity.Property(item => item.SchemaVersion).HasMaxLength(20);
        entity.Property(item => item.EventType).HasMaxLength(100);
        entity.Property(item => item.SourcePlatform).HasMaxLength(30);
        entity.Property(item => item.CorrelationId).HasMaxLength(100);
        entity.Property(item => item.SubjectType).HasMaxLength(50);
        entity.Property(item => item.SubjectId).HasMaxLength(100);
        entity.Property(item => item.SubjectDisplayName).HasMaxLength(160);
        entity.Property(item => item.Status).HasMaxLength(30);
        entity.Property(item => item.Severity).HasMaxLength(30);
        entity.Property(item => item.DataJson).HasColumnType("nvarchar(max)");
        entity.HasIndex(item => item.OccurredAt);
        entity.HasIndex(item => item.SourcePlatform);
    }
}
