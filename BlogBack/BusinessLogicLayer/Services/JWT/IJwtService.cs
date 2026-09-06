using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.Models;

namespace BusinessLogicLayer.Services.JWT;

public interface IJwtService
{
    string GenerateToken(ApplicationUser user);
}
