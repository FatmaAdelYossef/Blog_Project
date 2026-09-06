using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccessLayer.Seeders.Interfaces;

public interface ISeeder
{
    Task SeedAsync(IServiceProvider serviceProvider);
}