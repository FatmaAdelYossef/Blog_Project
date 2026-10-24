using System.Security.Claims;
using SharedLayer;

namespace BusinessLogicLayer.Services.Authorization;

/// <summary>
/// Shared ownership rules for posts and post media. A post without an author
/// (legacy data) can only be modified by an administrator.
/// </summary>
public static class PostAccess
{
    public static string? GetUserId(ClaimsPrincipal? user)
    {
        return user?.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    public static void EnsureCanModify(ClaimsPrincipal? user, string? authorId)
    {
        if (user?.Identity?.IsAuthenticated != true)
            throw new UnauthorizedAccessException("Authentication is required.");

        if (user.IsInRole(AppRoles.Admin))
            return;

        var userId = GetUserId(user);
        if (string.IsNullOrEmpty(authorId) || authorId != userId)
            throw new UnauthorizedAccessException("You can only modify your own posts.");
    }
}
