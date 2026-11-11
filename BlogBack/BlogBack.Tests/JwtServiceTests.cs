using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BusinessLogicLayer.Services.JWT;
using DataAccessLayer.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SharedLayer.ConfigClasses;

namespace BlogBack.Tests;

public class JwtServiceTests
{
    private const string Key = "test-signing-key-that-is-long-enough-32chars!!";

    private static JwtService CreateService() =>
        new(Options.Create(new JwtSettings
        {
            Key = Key,
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            ExpireDays = 1,
        }));

    private static TokenValidationParameters ValidationParams() => new()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "TestIssuer",
        ValidAudience = "TestAudience",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Key)),
    };

    private static ApplicationUser User() => new()
    {
        Id = "user-1",
        Email = "user@example.com",
        UserName = "user@example.com",
    };

    [Fact]
    public void GenerateToken_Produces_ValidatableToken_WithRolesAndClaims()
    {
        var service = CreateService();
        var token = service.GenerateToken(User(), new[] { "Admin", "Author" });

        var principal = new JwtSecurityTokenHandler().ValidateToken(token, ValidationParams(), out var validated);

        Assert.Equal("user-1", principal.FindFirstValue(ClaimTypes.NameIdentifier));
        Assert.Equal("user@example.com", principal.FindFirstValue(ClaimTypes.Email));
        Assert.Contains(principal.Claims, c => c.Type == ClaimTypes.Role && c.Value == "Admin");
        Assert.Contains(principal.Claims, c => c.Type == ClaimTypes.Role && c.Value == "Author");
        Assert.True(validated.ValidTo > DateTime.UtcNow);
    }

    [Fact]
    public void GenerateToken_Rejects_WrongSigningKey()
    {
        var service = CreateService();
        var token = service.GenerateToken(User(), Array.Empty<string>());

        var wrongKeyParams = ValidationParams();
        wrongKeyParams.IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes("a-completely-different-key-0123456789"));

        Assert.ThrowsAny<SecurityTokenException>(() =>
            new JwtSecurityTokenHandler().ValidateToken(token, wrongKeyParams, out _));
    }
}
