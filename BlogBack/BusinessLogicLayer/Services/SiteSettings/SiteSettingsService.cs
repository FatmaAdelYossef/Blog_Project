using DataAccessLayer.Context;
using DataAccessLayer.DTOs.SiteSettings;
using DataAccessLayer.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessLogicLayer.Services.SiteSettings;

public class SiteSettingsService : ISiteSettingsService
{
    private readonly BlogDbContext _context;

    public SiteSettingsService(BlogDbContext context)
    {
        _context = context;
    }

    public async Task<SiteSettingsDto> GetAsync()
    {
        var settings = await GetOrCreateAsync();
        return ToDto(settings);
    }

    public async Task<SiteSettingsDto> UpdateAsync(UpdateSiteSettingsDto dto, string? userId)
    {
        var settings = await GetOrCreateAsync();

        settings.SiteName = dto.SiteName.Trim();
        settings.Tagline = string.IsNullOrWhiteSpace(dto.Tagline) ? null : dto.Tagline.Trim();
        settings.AccentColorLight = NormalizeColor(dto.AccentColorLight);
        settings.AccentColorDark = NormalizeColor(dto.AccentColorDark);
        settings.UpdatedAt = DateTime.UtcNow;
        settings.UpdatedById = userId;

        await _context.SaveChangesAsync();
        return ToDto(settings);
    }

    private async Task<DataAccessLayer.Models.SiteSettings> GetOrCreateAsync()
    {
        var settings = await _context.SiteSettings.FindAsync(DataAccessLayer.Models.SiteSettings.SingletonId);
        if (settings != null) return settings;

        settings = new DataAccessLayer.Models.SiteSettings { Id = DataAccessLayer.Models.SiteSettings.SingletonId };
        await _context.SiteSettings.AddAsync(settings);
        await _context.SaveChangesAsync();
        return settings;
    }

    private static string? NormalizeColor(string? color)
    {
        if (string.IsNullOrWhiteSpace(color)) return null;
        var trimmed = color.Trim();
        return trimmed.Equals("#fff", StringComparison.OrdinalIgnoreCase) ||
               trimmed.Equals("#ffffff", StringComparison.OrdinalIgnoreCase)
            ? null
            : trimmed.ToLowerInvariant();
    }

    private static SiteSettingsDto ToDto(DataAccessLayer.Models.SiteSettings s) => new()
    {
        SiteName = s.SiteName,
        Tagline = s.Tagline,
        AccentColorLight = s.AccentColorLight,
        AccentColorDark = s.AccentColorDark,
    };
}
