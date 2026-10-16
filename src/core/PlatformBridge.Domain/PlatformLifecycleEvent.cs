using System.Text.Json;

namespace PlatformBridge.Domain;

public sealed record EventSubject(string Type, string Id, string? DisplayName);

public sealed record PlatformLifecycleEvent(
    string SchemaVersion,
    Guid EventId,
    string EventType,
    string SourcePlatform,
    DateTimeOffset OccurredAt,
    string CorrelationId,
    EventSubject Subject,
    string Status,
    string Severity,
    JsonElement Data)
{
    public void EnsureSemanticallyValid()
    {
        if (SchemaVersion != "1.0.0")
        {
            throw new ArgumentException("Only lifecycle contract version 1.0.0 is supported.");
        }

        var expectedPrefix = $"{SourcePlatform}.";
        if (!EventType.StartsWith(expectedPrefix, StringComparison.Ordinal))
        {
            throw new ArgumentException("The event type must belong to the source platform.");
        }
    }
}
