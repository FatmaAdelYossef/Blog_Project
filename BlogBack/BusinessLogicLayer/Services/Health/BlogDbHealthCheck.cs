using DataAccessLayer.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BusinessLogicLayer.Services.Health;

/// <summary>
/// Liveness check that actually opens a connection to PostgreSQL.
/// Exposed at GET /health by Program.cs for PaaS platforms and load balancers.
/// </summary>
public sealed class BlogDbHealthCheck : IHealthCheck
{
    private readonly BlogDbContext _context;

    public BlogDbHealthCheck(BlogDbContext context)
    {
        _context = context;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Degraded("The database is not accepting connections.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return HealthCheckResult.Unhealthy("Could not connect to the database.", ex);
        }
    }
}
