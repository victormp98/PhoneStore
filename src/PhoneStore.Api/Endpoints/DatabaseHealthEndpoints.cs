using Microsoft.EntityFrameworkCore;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class DatabaseHealthEndpoints
{
    public static IEndpointRouteBuilder MapDatabaseHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/database/ping", async (PhoneStoreDbContext dbContext) =>
        {
            var canConnect = await dbContext.Database.CanConnectAsync();

            return Results.Ok(new
            {
                database = "PostgreSQL",
                canConnect,
                status = canConnect ? "Connected" : "Not Connected",
                timestamp = DateTimeOffset.UtcNow
            });
        })
        .WithName("PingDatabase")
        .WithTags("Database");

        return app;
    }
}
