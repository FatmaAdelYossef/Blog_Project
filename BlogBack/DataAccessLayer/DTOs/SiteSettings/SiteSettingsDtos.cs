using System.ComponentModel.DataAnnotations;

namespace DataAccessLayer.DTOs.SiteSettings;

public class SiteSettingsDto
{
    public string SiteName { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string? AccentColorLight { get; set; }
    public string? AccentColorDark { get; set; }
}

public class UpdateSiteSettingsDto
{
    [Required]
    [StringLength(80, MinimumLength = 2)]
    public string SiteName { get; set; } = string.Empty;

    [StringLength(160)]
    public string? Tagline { get; set; }

    [RegularExpression(@"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", ErrorMessage = "Color must be a hex value like #9a3412.")]
    public string? AccentColorLight { get; set; }

    [RegularExpression(@"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$", ErrorMessage = "Color must be a hex value like #9a3412.")]
    public string? AccentColorDark { get; set; }
}
