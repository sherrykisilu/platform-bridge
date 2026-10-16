using System.Text.Json;
using PlatformBridge.Domain;

namespace PlatformBridge.Application;

public sealed class DashboardService(IPlatformEventRepository repository, TimeProvider timeProvider)
{
    private static readonly (string Id, string Name)[] PlatformDefinitions =
    [
        ("memorial", "Memorial portal"),
        ("donation", "Donation platform"),
        ("commerce", "E-commerce platform")
    ];

    public async Task<DashboardSnapshot> GetAsync(CancellationToken cancellationToken)
    {
        var recent = await repository.GetRecentAsync(50, cancellationToken);
        var platforms = PlatformDefinitions
            .Select(definition => CreatePlatformHealth(definition.Id, definition.Name, recent))
            .ToArray();

        var events = recent.Take(12).Select(ToLifecycleEvent).ToArray();
        return new DashboardSnapshot(
            timeProvider.GetUtcNow(),
            "local-demo",
            new DashboardSummary(
                await repository.CountAsync(cancellationToken),
                platforms.Count(platform => platform.Status == "healthy"),
                platforms.Count(platform => platform.Status is "attention" or "critical"),
                "1.0.0"),
            platforms,
            events);
    }

    private static PlatformHealth CreatePlatformHealth(
        string platformId,
        string name,
        IReadOnlyCollection<PlatformEventRecord> events)
    {
        var platformEvents = events
            .Where(item => item.SourcePlatform == platformId)
            .OrderByDescending(item => item.OccurredAt)
            .ToArray();
        var latest = platformEvents.FirstOrDefault();
        var status = latest?.Severity switch
        {
            "critical" => "critical",
            "warning" => "attention",
            null => "unknown",
            _ => "healthy"
        };

        return new PlatformHealth(
            platformId,
            name,
            status,
            latest?.OccurredAt,
            platformEvents.Length,
            latest is null ? "Awaiting first lifecycle event" : Describe(latest));
    }

    private static string Describe(PlatformEventRecord item) =>
        item.EventType switch
        {
            "memorial.published" => "Memorial content published",
            "donation.received" => "Donation entered processing",
            "donation.settled" => "Donation settlement completed",
            "commerce.order-placed" => "Order awaiting fulfilment",
            "commerce.order-fulfilled" => "Order fulfilled",
            _ => "Platform health signal received"
        };

    private static PlatformLifecycleEvent ToLifecycleEvent(PlatformEventRecord item) =>
        new(
            item.SchemaVersion,
            item.EventId,
            item.EventType,
            item.SourcePlatform,
            item.OccurredAt,
            item.CorrelationId,
            new EventSubject(item.SubjectType, item.SubjectId, item.SubjectDisplayName),
            item.Status,
            item.Severity,
            JsonSerializer.Deserialize<JsonElement>(item.DataJson));
}

public sealed record DashboardSnapshot(
    DateTimeOffset GeneratedAt,
    string Environment,
    DashboardSummary Summary,
    IReadOnlyList<PlatformHealth> Platforms,
    IReadOnlyList<PlatformLifecycleEvent> RecentEvents);

public sealed record DashboardSummary(
    int TotalEvents,
    int HealthyPlatforms,
    int AttentionRequired,
    string SchemaVersion);

public sealed record PlatformHealth(
    string Id,
    string Name,
    string Status,
    DateTimeOffset? LastEventAt,
    int EventCount,
    string LatestMessage);
