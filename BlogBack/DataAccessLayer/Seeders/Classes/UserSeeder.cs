using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DataAccessLayer.Models;
using DataAccessLayer.Seeders.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

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
                Password = "22"
            },
            new()
            {
                UserName = "fatmaeed2001@gmail.com",
                Email = "fatmaeed2001@gmail.com",
                EmailConfirmed = true,
                FirstName = "Fatma",
                LastName = "Adel",
                BirthDate = new DateTime(2001, 7, 12),
                Password = "22"
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
            }
        }
    }
}