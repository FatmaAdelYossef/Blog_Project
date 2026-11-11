using BusinessLogicLayer.Services.Auth;
using BusinessLogicLayer.Services.Email;
using BusinessLogicLayer.Services.JWT;
using DataAccessLayer.Context;
using DataAccessLayer.DTOs.Auth;
using DataAccessLayer.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SharedLayer.ConfigClasses;

namespace BlogBack.Tests;

public class AuthServiceTests
{
    private const string Password = "Str0ng-Password!";

    private readonly BlogDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly FakeEmailService _emailService = new();

    private sealed class FakeJwtService : IJwtService
    {
        public string GenerateToken(ApplicationUser user, IEnumerable<string> roles) =>
            $"access-{user.Id}";
    }

    private sealed class FakeEmailService : IEmailService
    {
        public List<string> SentTo { get; } = new();
        public Task SendEmailAsync(string toEmail, string subject, string body)
        {
            SentTo.Add(toEmail);
            return Task.CompletedTask;
        }
    }

    public AuthServiceTests()
    {
        _context = TestDb.CreateContext();
        var store = new UserStore<ApplicationUser, IdentityRole, BlogDbContext>(_context);

        _userManager = new UserManager<ApplicationUser>(
            store,
            Options.Create(new IdentityOptions()),
            new PasswordHasher<ApplicationUser>(),
            new IUserValidator<ApplicationUser>[] { new UserValidator<ApplicationUser>() },
            new IPasswordValidator<ApplicationUser>[] { new PasswordValidator<ApplicationUser>() },
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            new ServiceCollection().BuildServiceProvider(),
            NullLogger<UserManager<ApplicationUser>>.Instance);

        // Reset/change-password tokens go through the "Default" token provider;
        // register a real one backed by an ephemeral DataProtection key ring.
        _userManager.RegisterTokenProvider("Default", new DataProtectorTokenProvider<ApplicationUser>(
            DataProtectionProvider.Create("BlogBack.Tests"),
            Options.Create(new DataProtectionTokenProviderOptions()),
            NullLogger<DataProtectorTokenProvider<ApplicationUser>>.Instance));
    }

    private AuthService CreateService() =>
        new(_userManager, _context, new FakeJwtService(), _emailService,
            new TestWebHostEnvironment(),
            new ConfigurationBuilder().Build(),
            Options.Create(new JwtSettings
            {
                Key = "test-key",
                Issuer = "i",
                Audience = "a",
                ExpireDays = 1,
                RefreshTokenExpireDays = 30,
            }));

    private async Task<ApplicationUser> CreateUserAsync(string email = "user@example.com")
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
        };
        var result = await _userManager.CreateAsync(user, Password);
        Assert.True(result.Succeeded, string.Join(", ", result.Errors.Select(e => e.Description)));
        return user;
    }

    [Fact]
    public async Task LoginAsync_Rejects_WrongPassword_AndUnknownEmail_Identically()
    {
        await CreateUserAsync();
        var service = CreateService();

        var wrongPassword = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.LoginAsync(new LoginDto { Email = "user@example.com", Password = "wrong-password" }));
        var unknownEmail = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.LoginAsync(new LoginDto { Email = "nobody@example.com", Password = Password }));

        Assert.Equal(wrongPassword.Message, unknownEmail.Message);
    }

    [Fact]
    public async Task LoginAsync_Issues_TokenPair_AndStoresOnlyHash()
    {
        var user = await CreateUserAsync();
        var service = CreateService();

        var result = await service.LoginAsync(new LoginDto { Email = user.Email!, Password = Password });

        Assert.Equal($"access-{user.Id}", result.AccessToken);
        Assert.False(string.IsNullOrEmpty(result.RefreshToken));

        var stored = await _context.RefreshTokens.SingleAsync();
        Assert.Equal(user.Id, stored.UserId);
        Assert.NotEqual(result.RefreshToken, stored.TokenHash);
        Assert.True(stored.ExpiresAtUtc > DateTime.UtcNow);
    }

    [Fact]
    public async Task RefreshTokenAsync_Rotates_AndRejects_OldToken()
    {
        var user = await CreateUserAsync();
        var service = CreateService();
        var login = await service.LoginAsync(new LoginDto { Email = user.Email!, Password = Password });

        var refreshed = await service.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = login.RefreshToken });

        Assert.NotEqual(login.RefreshToken, refreshed.RefreshToken);
        Assert.Equal($"access-{user.Id}", refreshed.AccessToken);

        var oldToken = await _context.RefreshTokens
            .SingleAsync(t => t.RevokedAtUtc != null);
        Assert.NotNull(oldToken.RevokedAtUtc);
        Assert.NotNull(oldToken.ReplacedByTokenHash);

        // Reusing the rotated-out token is treated as theft: everything is revoked.
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = login.RefreshToken }));

        var active = await _context.RefreshTokens.CountAsync(t => t.RevokedAtUtc == null);
        Assert.Equal(0, active);
    }

    [Fact]
    public async Task RefreshTokenAsync_Rejects_UnknownToken()
    {
        var service = CreateService();
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = "garbage" }));
    }

    [Fact]
    public async Task RefreshTokenAsync_Rejects_ExpiredToken()
    {
        var user = await CreateUserAsync();
        var service = CreateService();
        var login = await service.LoginAsync(new LoginDto { Email = user.Email!, Password = Password });

        var stored = await _context.RefreshTokens.SingleAsync();
        stored.ExpiresAtUtc = DateTime.UtcNow.AddMinutes(-1);
        await _context.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = login.RefreshToken }));
    }

    [Fact]
    public async Task LogoutAsync_Revokes_RefreshToken()
    {
        var user = await CreateUserAsync();
        var service = CreateService();
        var login = await service.LoginAsync(new LoginDto { Email = user.Email!, Password = Password });

        await service.LogoutAsync(new LogoutRequestDto { RefreshToken = login.RefreshToken });

        var stored = await _context.RefreshTokens.SingleAsync();
        Assert.NotNull(stored.RevokedAtUtc);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = login.RefreshToken }));
    }

    [Fact]
    public async Task ChangePasswordAsync_Revokes_AllRefreshTokens()
    {
        var user = await CreateUserAsync();
        var service = CreateService();
        await service.LoginAsync(new LoginDto { Email = user.Email!, Password = Password });
        await service.LoginAsync(new LoginDto { Email = user.Email!, Password = Password });

        await service.ChangePasswordAsync(user.Id, new ChangePasswordDto
        {
            CurrentPassword = Password,
            NewPassword = "An0ther-Str0ng!",
        });

        var active = await _context.RefreshTokens.CountAsync(t => t.RevokedAtUtc == null);
        Assert.Equal(0, active);
    }

    [Fact]
    public async Task ResetPasswordAsync_ReturnsSameError_ForUnknownEmail_AndBadToken()
    {
        var user = await CreateUserAsync();
        var service = CreateService();

        // Valid base64url token shape, wrong value.
        var badToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        var unknownEx = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ResetPasswordAsync(new ResetPasswordDto
            {
                Email = "ghost@example.com", Token = badToken, NewPassword = "New-Str0ng!",
            }));

        var badTokenEx = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ResetPasswordAsync(new ResetPasswordDto
            {
                Email = user.Email!, Token = badToken, NewPassword = "New-Str0ng!",
            }));

        Assert.Equal(unknownEx.Message, badTokenEx.Message);
        Assert.Equal("Invalid or expired reset token.", unknownEx.Message);
    }
}
