using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PlatformBridge.Application;

namespace PlatformBridge.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPlatformBridgeInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var provider = configuration["Persistence:Provider"] ?? "InMemory";
        if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            var connectionString = configuration.GetConnectionString("PlatformBridge")
                ?? throw new InvalidOperationException("ConnectionStrings:PlatformBridge is required.");
            services.AddDbContext<PlatformBridgeDbContext>(
                options => options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure()));
        }
        else
        {
            services.AddDbContext<PlatformBridgeDbContext>(
                options => options.UseInMemoryDatabase("platform-bridge"));
        }

        services.AddScoped<IPlatformEventRepository, EfPlatformEventRepository>();
        return services;
    }
}
