using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using NJsonSchema;
using PlatformBridge.Application;
using PlatformBridge.Domain;
using PlatformBridge.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin()));
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<EventIngestionService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddPlatformBridgeInfrastructure(builder.Configuration);

var schemaPath = Path.Combine(AppContext.BaseDirectory, "contracts", "platform-lifecycle-event.v1.schema.json");
var contractSchema = await JsonSchema.FromFileAsync(schemaPath);
builder.Services.AddSingleton(contractSchema);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.MapHealthChecks("/health");

app.MapPost("/api/events", async (
    JsonElement payload,
    JsonSchema schema,
    EventIngestionService service,
    CancellationToken cancellationToken) =>
{
    var validationErrors = schema.Validate(payload.GetRawText());
    if (validationErrors.Count > 0)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["contract"] = validationErrors
                .Select(error => $"{error.Path}: {error.Kind}")
                .Distinct()
                .ToArray()
        });
    }

    var lifecycleEvent = payload.Deserialize<PlatformLifecycleEvent>(
        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    if (lifecycleEvent is null)
    {
        return Results.BadRequest(new { error = "The lifecycle event payload could not be read." });
    }

    try
    {
        var result = await service.IngestAsync(lifecycleEvent, cancellationToken);
        return result.Accepted
            ? Results.Accepted($"/api/events/{result.EventId}", result)
            : Results.Ok(result);
    }
    catch (ArgumentException exception)
    {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            ["contract"] = [exception.Message]
        });
    }
})
.WithName("IngestLifecycleEvent")
.Produces<IngestionResult>(StatusCodes.Status202Accepted)
.ProducesValidationProblem();

app.MapGet("/api/dashboard", async (
    DashboardService service,
    CancellationToken cancellationToken) =>
    Results.Ok(await service.GetAsync(cancellationToken)))
    .WithName("GetOperationsDashboard")
    .Produces<DashboardSnapshot>();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<PlatformBridgeDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
    await DemoDataSeeder.SeedAsync(dbContext);
}

app.Run();

public partial class Program;

internal static class DemoDataSeeder
{
    public static async Task SeedAsync(PlatformBridgeDbContext dbContext)
    {
        if (await dbContext.PlatformEvents.AnyAsync())
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        dbContext.PlatformEvents.AddRange(
            Create(
                "3d236768-669b-46b4-9225-3db7296814f4",
                "memorial.published",
                "memorial",
                now.AddMinutes(-18),
                "MEM-1042",
                "completed",
                "info",
                """{"locale":"de-DE","visibility":"public"}"""),
            Create(
                "8bf16af1-0604-4a13-840d-50a7ed26c542",
                "donation.received",
                "donation",
                now.AddMinutes(-11),
                "DON-8821",
                "processing",
                "info",
                """{"currency":"EUR","amountMinor":7500}"""),
            Create(
                "658b58d4-b96b-4fcc-a854-81d5d17cd091",
                "commerce.order-placed",
                "commerce",
                now.AddMinutes(-4),
                "ORD-3098",
                "pending",
                "warning",
                """{"currency":"EUR","amountMinor":12900,"itemCount":2}"""));

        await dbContext.SaveChangesAsync();
    }

    private static PlatformEventRecord Create(
        string eventId,
        string eventType,
        string source,
        DateTimeOffset occurredAt,
        string subjectId,
        string status,
        string severity,
        string data) =>
        new()
        {
            EventId = Guid.Parse(eventId),
            SchemaVersion = "1.0.0",
            EventType = eventType,
            SourcePlatform = source,
            OccurredAt = occurredAt,
            CorrelationId = $"{source}-{subjectId}",
            SubjectType = source == "commerce" ? "order" : source,
            SubjectId = subjectId,
            SubjectDisplayName = source switch
            {
                "memorial" => "Memorial publication",
                "donation" => "Donation received",
                _ => "Store order"
            },
            Status = status,
            Severity = severity,
            DataJson = data,
            ReceivedAt = occurredAt
        };
}
