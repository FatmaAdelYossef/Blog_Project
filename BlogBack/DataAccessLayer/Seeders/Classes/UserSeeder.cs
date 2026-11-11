using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DataAccessLayer.Models;
using DataAccessLayer.Seeders.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SharedLayer;

namespace DataAccessLayer.Seeders.Classes;

public class UserSeeder : ISeeder
{
    private class UserSeederInfo : ApplicationUser
    {
        public string Password { get; set; } = null!;
    }

    public async Task SeedAsync(IServiceProvider services)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var configuration = services.GetRequiredService<IConfiguration>();
        var logger = services.GetRequiredService<ILogger<UserSeeder>>();

        var defaultPassword = configuration["Seed:DefaultPassword"];
        if (string.IsNullOrWhiteSpace(defaultPassword))
        {
            logger.LogWarning("Seed:DefaultPassword is not configured. Skipping default user seeding.");
            return;
        }

        var usersInfoList = new List<UserSeederInfo>
        {
            new()
            {
                UserName = "ymtawfiq2003@gmail.com",
                Email = "ymtawfiq2003@gmail.com",
                EmailConfirmed = true,
                FirstName = "Yousef",
                LastName = "Mohamed",
                BirthDate = new DateTime(2003, 3, 20),
                Password = defaultPassword
            },
            new()
            {
                UserName = "fatmaeed2001@gmail.com",
                Email = "fatmaeed2001@gmail.com",
                EmailConfirmed = true,
                FirstName = "Fatma",
                LastName = "Adel",
                BirthDate = new DateTime(2001, 7, 12),
                Password = defaultPassword
            }
        };

        foreach (var userInfo in usersInfoList)
        {
            var user = await userManager.FindByEmailAsync(userInfo.UserName!);

            if (user == null)
            {
                var result = await userManager.CreateAsync(userInfo, userInfo.Password);

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(x => x.Description));
                    throw new Exception($"Failed to create default user: {errors}");
                }

                user = userInfo;
            }

            if (!await userManager.IsInRoleAsync(user, AppRoles.Admin))
            {
                var roleResult = await userManager.AddToRoleAsync(user, AppRoles.Admin);
                if (!roleResult.Succeeded)
                {
                    var errors = string.Join(", ", roleResult.Errors.Select(x => x.Description));
                    throw new Exception($"Failed to assign the Admin role: {errors}");
                }
            }
        }
    }
}