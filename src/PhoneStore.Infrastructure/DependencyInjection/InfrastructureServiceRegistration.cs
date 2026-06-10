using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Infrastructure.DependencyInjection;

public static class InfrastructureServiceRegistration
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("PhoneStoreDatabase");

        services.AddDbContext<PhoneStoreDbContext>(options =>
        {
            options.UseNpgsql(connectionString);
        });

        return services;
    }
}
