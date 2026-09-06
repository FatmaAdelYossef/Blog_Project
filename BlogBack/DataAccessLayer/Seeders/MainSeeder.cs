using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.Seeders.Classes;
using DataAccessLayer.Seeders.Interfaces;

namespace DataAccessLayer.Seeders;

public static class MainSeeder
{
    private static readonly List<ISeeder> _seeders = new()
    {
        new UserSeeder(),
        new BlogSeeder()
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        foreach (var seeder in _seeders)
        {
            await seeder.SeedAsync(services);
        }
    }
}