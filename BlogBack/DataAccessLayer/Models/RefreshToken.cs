namespace DataAccessLayer.Models;

/// <summary>
/// Server-side record for a refresh token. Only the SHA-256 hash of the token
/// is stored; the raw token exists only in the client's storage. Rotation on
/// every refresh and revocation on logout/password change limit the blast
/// radius of a leaked token.
/// </summary>
public class RefreshToken
{
    public int Id { get; set; }
    public string UserId { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAtUtc { get; set; }
    public string? ReplacedByTokenHash { get; set; }
}
