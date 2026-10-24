using DataAccessLayer.Seeders.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SharedLayer;

namespace DataAccessLayer.Seeders.Classes;

public class RoleSeeder : ISeeder
{
    public async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var logger = services.GetRequiredService<ILogger<RoleSeeder>>();

        foreach (var roleName in new[] { AppRoles.Admin, AppRoles.Author })
        {
            if (await roleManager.RoleExistsAsync(roleName))
                continue;

            var result = await roleManager.CreateAsync(new IdentityRole(roleName));
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(x => x.Description));
                throw new Exception($"Failed to create role '{roleName}': {errors}");
            }

            logger.LogInformation("Created role {Role}.", roleName);
        }
    }
}
