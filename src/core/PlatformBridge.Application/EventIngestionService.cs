using PlatformBridge.Domain;

namespace PlatformBridge.Application;

public sealed class EventIngestionService(IPlatformEventRepository repository, TimeProvider timeProvider)
{
    public async Task<IngestionResult> IngestAsync(
        PlatformLifecycleEvent lifecycleEvent,
        CancellationToken cancellationToken)
    {
        lifecycleEvent.EnsureSemanticallyValid();

        if (await repository.ExistsAsync(lifecycleEvent.EventId, cancellationToken))
        {
            return new IngestionResult(lifecycleEvent.EventId, false, "duplicate");
        }

        var record = new PlatformEventRecord
        {
            EventId = lifecycleEvent.EventId,
            SchemaVersion = lifecycleEvent.SchemaVersion,
            EventType = lifecycleEvent.EventType,
            SourcePlatform = lifecycleEvent.SourcePlatform,
            OccurredAt = lifecycleEvent.OccurredAt,
            CorrelationId = lifecycleEvent.CorrelationId,
            SubjectType = lifecycleEvent.Subject.Type,
            SubjectId = lifecycleEvent.Subject.Id,
            SubjectDisplayName = lifecycleEvent.Subject.DisplayName,
            Status = lifecycleEvent.Status,
            Severity = lifecycleEvent.Severity,
            DataJson = lifecycleEvent.Data.GetRawText(),
            ReceivedAt = timeProvider.GetUtcNow()
        };

        await repository.AddAsync(record, cancellationToken);
        return new IngestionResult(lifecycleEvent.EventId, true, "accepted");
    }
}

public sealed record IngestionResult(Guid EventId, bool Accepted, string Disposition);
