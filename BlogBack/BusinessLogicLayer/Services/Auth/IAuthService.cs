using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.DTOs.Auth;

namespace BusinessLogicLayer.Services.Auth;

public interface IAuthService
{
    Task<string> LoginAsync(LoginDto model);
    Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto model);
    Task<bool> ForgotPasswordAsync(ForgotPasswordDto dto);
    Task<bool> ResetPasswordAsync(ResetPasswordDto model);
}
