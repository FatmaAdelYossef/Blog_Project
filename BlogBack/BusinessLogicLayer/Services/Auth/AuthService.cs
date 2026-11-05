using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BusinessLogicLayer.Services.Email;
using BusinessLogicLayer.Services.JWT;
using DataAccessLayer.DTOs.Auth;
using DataAccessLayer.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Hosting;
using SharedLayer;
using SharedLayer.Helpers;
using Microsoft.Extensions.Configuration;

namespace BusinessLogicLayer.Services.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IJwtService jwtService,
        IEmailService emailService,
        IWebHostEnvironment env,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _emailService = emailService;
        _env = env;
        _configuration = configuration;
    }

    public async Task<string> LoginAsync(LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
        {
            throw new Exception("Invalid email or password.");
        }

        var token = _jwtService.GenerateToken(user, await _userManager.GetRolesAsync(user));
        return token;
    }

    public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto model)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) throw new Exception("User not found.");

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new Exception(errors);
        }

        return true;
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return false;

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        // Frontend:Origin is the single source for the app's public URL (CORS + reset links).
        // Falls back to the environment defaults when only Developing locally.
        var frontUrl = _configuration["Frontend:Origin"];
        if (string.IsNullOrWhiteSpace(frontUrl))
        {
            frontUrl = _env.IsDevelopment()
                ? AppConstants.FrontUrlDevelopment
                : AppConstants.FrontUrlProduction;
        }

        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var resetUrl = $"{frontUrl}/reset-password?email={dto.Email}&token={encodedToken}";

        var title = $"We received a request to reset your password for account <b>{user.Email}</b>. Click the button below:";

        var htmlBody = PublicHelperShared.GenerateEmailTemplate(title, resetUrl, isLink: true);

        await _emailService.SendEmailAsync(dto.Email, "Reset Your Password - Blog App", htmlBody);

        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null) throw new Exception("User not found.");

        var decodedTokenBytes = WebEncoders.Base64UrlDecode(model.Token);
        var normalToken = Encoding.UTF8.GetString(decodedTokenBytes);

        var result = await _userManager.ResetPasswordAsync(user, normalToken, model.NewPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new Exception(errors);
        }

        return true;
    }
}