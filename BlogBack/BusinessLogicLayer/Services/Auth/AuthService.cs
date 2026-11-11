using System.Security.Cryptography;
using System.Text;
using BusinessLogicLayer.Services.Email;
using BusinessLogicLayer.Services.JWT;
using DataAccessLayer.Context;
using DataAccessLayer.DTOs.Auth;
using DataAccessLayer.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using SharedLayer;
using SharedLayer.ConfigClasses;
using SharedLayer.Helpers;

namespace BusinessLogicLayer.Services.Auth;

public class AuthService : IAuthService
{
    // Precomputed hash used to equalize login timing for unknown emails:
    // FindByEmailAsync returns fast for missing users, so we still run a
    // password verification against this dummy hash before failing.
    private static readonly string DummyPasswordHash =
        new PasswordHasher<ApplicationUser>().HashPassword(new ApplicationUser(), "dummy-password-for-timing");

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly BlogDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _configuration;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        BlogDbContext context,
        IJwtService jwtService,
        IEmailService emailService,
        IWebHostEnvironment env,
        IConfiguration configuration,
        IOptions<JwtSettings> jwtSettings)
    {
        _userManager = userManager;
        _context = context;
        _jwtService = jwtService;
        _emailService = emailService;
        _env = env;
        _configuration = configuration;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
        {
            _userManager.PasswordHasher.VerifyHashedPassword(user!, DummyPasswordHash, model.Password);
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!await _userManager.CheckPasswordAsync(user, model.Password))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return await IssueTokenPairAsync(user);
    }

    public async Task<LoginResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto)
    {
        var tokenHash = HashToken(dto.RefreshToken);
        var stored = await _context.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

        if (stored is null)
            throw new UnauthorizedAccessException("Invalid refresh token.");

        if (stored.RevokedAtUtc is not null)
        {
            // A revoked token being replayed means it was likely stolen and
            // rotated by the legitimate client. Revoke the whole session family.
            await RevokeAllForUserAsync(stored.UserId);
            throw new UnauthorizedAccessException("Refresh token has been revoked.");
        }

        if (stored.ExpiresAtUtc <= DateTime.UtcNow)
            throw new UnauthorizedAccessException("Refresh token has expired.");

        if (stored.User is null)
            throw new UnauthorizedAccessException("Invalid refresh token.");

        // Rotate: revoke the presented token and issue a fresh pair.
        var (newRefreshEntity, newRawToken) = await IssueRefreshTokenAsync(stored.UserId);
        stored.RevokedAtUtc = DateTime.UtcNow;
        stored.ReplacedByTokenHash = newRefreshEntity.TokenHash;

        var roles = await _userManager.GetRolesAsync(stored.User);
        var accessToken = _jwtService.GenerateToken(stored.User, roles);

        await _context.SaveChangesAsync();

        return BuildLoginResponse(accessToken, newRawToken, newRefreshEntity.ExpiresAtUtc);
    }

    public async Task LogoutAsync(LogoutRequestDto? dto)
    {
        if (string.IsNullOrWhiteSpace(dto?.RefreshToken))
            return;

        var tokenHash = HashToken(dto.RefreshToken);
        var stored = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.RevokedAtUtc == null);

        if (stored is not null)
        {
            stored.RevokedAtUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ChangePasswordAsync(string userId, ChangePasswordDto model)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) throw new Exception("User not found.");

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }

        // Invalidate every outstanding session: old access tokens still expire
        // on their own, but no refresh token may mint new ones.
        await RevokeAllForUserAsync(userId);
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
        var resetUrl = $"{frontUrl}/reset-password?email={Uri.EscapeDataString(dto.Email)}&token={encodedToken}";

        var title = $"We received a request to reset your password for account <b>{user.Email}</b>. Click the button below:";

        var htmlBody = PublicHelperShared.GenerateEmailTemplate(title, resetUrl, isLink: true);

        await _emailService.SendEmailAsync(dto.Email, "Reset Your Password - Blog App", htmlBody);

        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordDto model)
    {
        var user = await _userManager.FindByEmailAsync(model.Email);

        string normalToken;
        try
        {
            var decodedTokenBytes = WebEncoders.Base64UrlDecode(model.Token);
            normalToken = Encoding.UTF8.GetString(decodedTokenBytes);
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Invalid or expired reset token.");
        }

        // Unknown users get the same error as bad tokens so the endpoint
        // cannot be used to enumerate accounts.
        if (user is null)
            throw new InvalidOperationException("Invalid or expired reset token.");

        var result = await _userManager.ResetPasswordAsync(user, normalToken, model.NewPassword);

        if (!result.Succeeded)
        {
            // Token failures get the same message as unknown users so the
            // endpoint cannot distinguish "no such account" from "bad token".
            // Password-policy failures stay descriptive for legitimate users.
            if (result.Errors.Any(e => e.Code == "InvalidToken"))
                throw new InvalidOperationException("Invalid or expired reset token.");

            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }

        await RevokeAllForUserAsync(user.Id);
        return true;
    }

    private async Task<LoginResponseDto> IssueTokenPairAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _jwtService.GenerateToken(user, roles);
        var (refreshEntity, rawToken) = await IssueRefreshTokenAsync(user.Id);
        await _context.SaveChangesAsync();

        return BuildLoginResponse(accessToken, rawToken, refreshEntity.ExpiresAtUtc);
    }

    /// <summary>
    /// Creates and stages a new refresh-token row. The raw token is returned to
    /// the caller exactly once; only its SHA-256 hash is persisted.
    /// </summary>
    private Task<(RefreshToken Entity, string RawToken)> IssueRefreshTokenAsync(string userId)
    {
        var rawToken = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(64));
        var entity = new RefreshToken
        {
            UserId = userId,
            TokenHash = HashToken(rawToken),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpireDays > 0
                ? _jwtSettings.RefreshTokenExpireDays
                : 30),
            CreatedAtUtc = DateTime.UtcNow,
        };

        _context.RefreshTokens.Add(entity);
        return Task.FromResult((entity, rawToken));
    }

    private LoginResponseDto BuildLoginResponse(string accessToken, string rawRefreshToken, DateTime refreshExpiresAtUtc)
    {
        return new LoginResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            AccessTokenExpiresAtUtc = DateTime.UtcNow.AddDays(_jwtSettings.ExpireDays),
            RefreshTokenExpiresAtUtc = refreshExpiresAtUtc,
        };
    }

    private async Task RevokeAllForUserAsync(string userId)
    {
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var token in tokens)
        {
            token.RevokedAtUtc = now;
        }

        await _context.SaveChangesAsync();
    }

    private static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
