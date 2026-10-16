using PlatformBridge.Domain;

namespace PlatformBridge.Application;

public interface IPlatformEventRepository
{
    Task<bool> ExistsAsync(Guid eventId, CancellationToken cancellationToken);
    Task AddAsync(PlatformEventRecord eventRecord, CancellationToken cancellationToken);
    Task<IReadOnlyList<PlatformEventRecord>> GetRecentAsync(int limit, CancellationToken cancellationToken);
    Task<int> CountAsync(CancellationToken cancellationToken);
}
