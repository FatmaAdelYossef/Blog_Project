using System.ComponentModel.DataAnnotations;

namespace DataAccessLayer.Models;

/// <summary>
/// Singleton row (Id = 1) holding the public-facing site identity and theme
/// accents chosen by the blog owner from the dashboard.
/// </summary>
public class SiteSettings
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;

    [Required]
    [StringLength(80)]
    public string SiteName { get; set; } = "My Blog";

    [StringLength(160)]
    public string? Tagline { get; set; }

    /// <summary>Hex accent used in light mode; null means "use the default palette".</summary>
    [StringLength(7)]
    public string? AccentColorLight { get; set; }

    /// <summary>Hex accent used in dark mode; falls back to <see cref="AccentColorLight"/>.</summary>
    [StringLength(7)]
    public string? AccentColorDark { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedById { get; set; }
}
