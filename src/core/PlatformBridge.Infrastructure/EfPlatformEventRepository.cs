using Microsoft.EntityFrameworkCore;
using PlatformBridge.Application;
using PlatformBridge.Domain;

namespace PlatformBridge.Infrastructure;

public sealed class EfPlatformEventRepository(PlatformBridgeDbContext dbContext)
    : IPlatformEventRepository
{
    public Task<bool> ExistsAsync(Guid eventId, CancellationToken cancellationToken) =>
        dbContext.PlatformEvents.AnyAsync(item => item.EventId == eventId, cancellationToken);

    public async Task AddAsync(PlatformEventRecord eventRecord, CancellationToken cancellationToken)
    {
        dbContext.PlatformEvents.Add(eventRecord);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PlatformEventRecord>> GetRecentAsync(
        int limit,
        CancellationToken cancellationToken) =>
        await dbContext.PlatformEvents
            .AsNoTracking()
            .OrderByDescending(item => item.OccurredAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

    public Task<int> CountAsync(CancellationToken cancellationToken) =>
        dbContext.PlatformEvents.CountAsync(cancellationToken);
}
