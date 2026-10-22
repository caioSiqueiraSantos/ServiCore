using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ServiCore.Application.Common.Interfaces;
using ServiCore.Infrastructure.Persistence;
using ServiCore.Infrastructure.Services;

namespace ServiCore.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
                               ?? "Data Source=servicore.db";

        services.AddDbContext<ServiCoreDbContext>((sp, options) =>
        {
            options.UseSqlite(connectionString);
        });

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<ServiCoreDbContext>());
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentWorkspaceService, CurrentWorkspaceService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        return services;
    }
}
