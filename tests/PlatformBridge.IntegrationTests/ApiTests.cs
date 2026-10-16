using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace PlatformBridge.IntegrationTests;

public sealed class ApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client;

    public ApiTests(WebApplicationFactory<Program> factory)
    {
        client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Persistence:Provider", "InMemory");
            builder.UseSetting("Environment", "Testing");
        }).CreateClient();
    }

    [Fact]
    public async Task Dashboard_returns_all_three_platforms()
    {
        var response = await client.GetAsync("/api/dashboard");
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Assert.Equal("local-demo", document.RootElement.GetProperty("environment").GetString());
        Assert.Equal(3, document.RootElement.GetProperty("platforms").GetArrayLength());
    }

    [Fact]
    public async Task Event_endpoint_rejects_payload_outside_shared_contract()
    {
        var response = await client.PostAsJsonAsync("/api/events", new
        {
            schemaVersion = "2.0.0",
            eventId = Guid.NewGuid()
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Shared_contract_fixture_is_accepted()
    {
        var fixturePath = Path.Combine(
            FindRepositoryRoot(),
            "contracts",
            "examples",
            "commerce-order-placed.v1.json");
        var payload = await File.ReadAllTextAsync(fixturePath);

        var response = await client.PostAsync(
            "/api/events",
            new StringContent(payload, System.Text.Encoding.UTF8, "application/json"));

        Assert.True(
            response.StatusCode is HttpStatusCode.Accepted or HttpStatusCode.OK,
            await response.Content.ReadAsStringAsync());
    }

    private static string FindRepositoryRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "PlatformBridge.sln")))
        {
            directory = directory.Parent;
        }

        return directory?.FullName
            ?? throw new InvalidOperationException("Repository root could not be located.");
    }
}
