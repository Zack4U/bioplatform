using Bio.Application.Common.Interfaces;
using Bio.Infrastructure.Persistence;
using Bio.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Bio.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("MarketplaceConnection"))); // Cambiado DefaultConnection por MarketplaceConnection

        // IMPORTANTE: Permitir que Application use el Contexto mediante su Interfaz
        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        // Servicios Externos
        services.AddScoped<IPaymentService, StripePaymentService>();

        return services;
    }
}