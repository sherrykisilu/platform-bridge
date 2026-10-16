namespace PlatformBridge.Domain;

public sealed class PlatformEventRecord
{
    public Guid EventId { get; set; }
    public string SchemaVersion { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string SourcePlatform { get; set; } = string.Empty;
    public DateTimeOffset OccurredAt { get; set; }
    public string CorrelationId { get; set; } = string.Empty;
    public string SubjectType { get; set; } = string.Empty;
    public string SubjectId { get; set; } = string.Empty;
    public string? SubjectDisplayName { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string DataJson { get; set; } = "{}";
    public DateTimeOffset ReceivedAt { get; set; }
}
