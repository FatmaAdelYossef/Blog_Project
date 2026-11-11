using DataAccessLayer.DTOs.Auth;

namespace BusinessLogicLayer.Services.Auth;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginDto model);
    Task<LoginResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto);
    Task LogoutAsync(LogoutRequestDto? dto);
    Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto model);
    Task<bool> ForgotPasswordAsync(ForgotPasswordDto dto);
    Task<bool> ResetPasswordAsync(ResetPasswordDto model);
}
