using System.Text.Json;
using PlatformBridge.Application;
using PlatformBridge.Domain;

namespace PlatformBridge.UnitTests;

public sealed class EventIngestionServiceTests
{
    [Fact]
    public async Task IngestAsync_persists_a_valid_event()
    {
        var repository = new InMemoryRepository();
        var service = new EventIngestionService(repository, TimeProvider.System);
        var lifecycleEvent = CreateEvent();

        var result = await service.IngestAsync(lifecycleEvent, CancellationToken.None);

        Assert.True(result.Accepted);
        Assert.Single(repository.Events);
        Assert.Equal("commerce", repository.Events[0].SourcePlatform);
    }

    [Fact]
    public async Task IngestAsync_is_idempotent_by_event_id()
    {
        var repository = new InMemoryRepository();
        var service = new EventIngestionService(repository, TimeProvider.System);
        var lifecycleEvent = CreateEvent();

        await service.IngestAsync(lifecycleEvent, CancellationToken.None);
        var duplicate = await service.IngestAsync(lifecycleEvent, CancellationToken.None);

        Assert.False(duplicate.Accepted);
        Assert.Equal("duplicate", duplicate.Disposition);
        Assert.Single(repository.Events);
    }

    [Fact]
    public async Task IngestAsync_rejects_mismatched_source_and_event_type()
    {
        var service = new EventIngestionService(new InMemoryRepository(), TimeProvider.System);
        var lifecycleEvent = CreateEvent() with { SourcePlatform = "donation" };

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => service.IngestAsync(lifecycleEvent, CancellationToken.None));

        Assert.Contains("source platform", exception.Message);
    }

    private static PlatformLifecycleEvent CreateEvent() =>
        new(
            "1.0.0",
            Guid.NewGuid(),
            "commerce.order-placed",
            "commerce",
            DateTimeOffset.UtcNow,
            "commerce-ORD-1",
            new EventSubject("order", "ORD-1", "Store order"),
            "pending",
            "info",
            JsonSerializer.Deserialize<JsonElement>("""{"currency":"EUR"}"""));

    private sealed class InMemoryRepository : IPlatformEventRepository
    {
        public List<PlatformEventRecord> Events { get; } = [];

        public Task<bool> ExistsAsync(Guid eventId, CancellationToken cancellationToken) =>
            Task.FromResult(Events.Any(item => item.EventId == eventId));

        public Task AddAsync(PlatformEventRecord eventRecord, CancellationToken cancellationToken)
        {
            Events.Add(eventRecord);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<PlatformEventRecord>> GetRecentAsync(
            int limit,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<PlatformEventRecord>>(Events.Take(limit).ToArray());

        public Task<int> CountAsync(CancellationToken cancellationToken) =>
            Task.FromResult(Events.Count);
    }
}
