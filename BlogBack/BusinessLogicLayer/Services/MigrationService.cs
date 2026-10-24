using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.Seeders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BusinessLogicLayer.Services;

public class MigrationService<TContext> : IHostedService
    where TContext : DbContext
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MigrationService<TContext>> _logger;

    public MigrationService(
        IServiceProvider serviceProvider,
        ILogger<MigrationService<TContext>> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<TContext>();

        try
        {
            var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync(cancellationToken);

            var migrations = pendingMigrations.ToList();

            if (migrations.Any())
            {
                _logger.LogInformation("Found {Count} pending migrations.", migrations.Count);

                foreach (var migration in migrations)
                {
                    _logger.LogInformation("Pending migration: {Migration}", migration);
                }

                await dbContext.Database.MigrateAsync(cancellationToken);

                _logger.LogInformation("Database migration completed successfully.");
            }
            else
            {
                _logger.LogInformation("Database is up to date.");
            }

            // Always run seeders
            await MainSeeder.SeedAsync(scope.ServiceProvider);

            _logger.LogInformation("Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while initializing the database.");

            throw;
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}