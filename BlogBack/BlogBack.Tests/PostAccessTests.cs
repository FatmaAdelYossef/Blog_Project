using System.Security.Claims;
using BusinessLogicLayer.Services.Authorization;
using SharedLayer;

namespace BlogBack.Tests;

public class PostAccessTests
{
    private static ClaimsPrincipal Principal(bool authenticated, string? userId = null, params string[] roles)
    {
        var claims = new List<Claim>();
        if (userId is not null)
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        return new ClaimsPrincipal(new ClaimsIdentity(claims, authenticated ? "Test" : null));
    }

    [Fact]
    public void EnsureCanModify_Throws_WhenUnauthenticated()
    {
        var user = Principal(authenticated: false);
        Assert.Throws<UnauthorizedAccessException>(() =>
            PostAccess.EnsureCanModify(user, "author-1"));
    }

    [Fact]
    public void EnsureCanModify_Allows_AdminRegardlessOfOwnership()
    {
        var admin = Principal(true, "admin-1", AppRoles.Admin);
        PostAccess.EnsureCanModify(admin, "someone-else");
    }

    [Fact]
    public void EnsureCanModify_Allows_PostOwner()
    {
        var author = Principal(true, "author-1");
        PostAccess.EnsureCanModify(author, "author-1");
    }

    [Fact]
    public void EnsureCanModify_Throws_ForNonOwner()
    {
        var other = Principal(true, "author-2");
        Assert.Throws<UnauthorizedAccessException>(() =>
            PostAccess.EnsureCanModify(other, "author-1"));
    }

    [Fact]
    public void EnsureCanModify_Throws_ForUnownedPost_UnlessAdmin()
    {
        var author = Principal(true, "author-1");
        Assert.Throws<UnauthorizedAccessException>(() =>
            PostAccess.EnsureCanModify(author, null));

        var admin = Principal(true, "admin-1", AppRoles.Admin);
        PostAccess.EnsureCanModify(admin, null);
    }
}
