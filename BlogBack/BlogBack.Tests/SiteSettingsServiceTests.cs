using BusinessLogicLayer.Services.SiteSettings;
using DataAccessLayer.Context;
using DataAccessLayer.DTOs.SiteSettings;

namespace BlogBack.Tests;

public class SiteSettingsServiceTests
{
    private readonly BlogDbContext _context;
    private readonly SiteSettingsService _service;

    public SiteSettingsServiceTests()
    {
        _context = TestDb.CreateContext();
        _service = new SiteSettingsService(_context);
    }

    [Fact]
    public async Task GetAsync_CreatesSingleton_WithDefaults()
    {
        var dto = await _service.GetAsync();

        Assert.Equal("My Blog", dto.SiteName);
        Assert.Null(dto.Tagline);
        Assert.Null(dto.AccentColorLight);
        Assert.Null(dto.AccentColorDark);
        Assert.Single(_context.SiteSettings);
    }

    [Fact]
    public async Task GetAsync_ReturnsSameRow_OnSubsequentCalls()
    {
        await _service.GetAsync();
        var dto = await _service.GetAsync();

        Assert.Equal(DataAccessLayer.Models.SiteSettings.SingletonId, _context.SiteSettings.Single().Id);
        Assert.Equal("My Blog", dto.SiteName);
    }

    [Fact]
    public async Task UpdateAsync_PersistsAllFields()
    {
        var dto = await _service.UpdateAsync(new UpdateSiteSettingsDto
        {
            SiteName = "Midnight Pages",
            Tagline = "Notes after dark",
            AccentColorLight = "#336699",
            AccentColorDark = "#88AACC",
        }, "user-1");

        Assert.Equal("Midnight Pages", dto.SiteName);
        Assert.Equal("Notes after dark", dto.Tagline);
        Assert.Equal("#336699", dto.AccentColorLight);
        Assert.Equal("#88aacc", dto.AccentColorDark);

        var stored = _context.SiteSettings.Single();
        Assert.Equal("user-1", stored.UpdatedById);
        Assert.True(stored.UpdatedAt <= DateTime.UtcNow);
    }

    [Fact]
    public async Task UpdateAsync_TrimsName_AndClearsBlankTagline()
    {
        var dto = await _service.UpdateAsync(new UpdateSiteSettingsDto
        {
            SiteName = "  Padded Name  ",
            Tagline = "   ",
        }, null);

        Assert.Equal("Padded Name", dto.SiteName);
        Assert.Null(dto.Tagline);
    }

    [Fact]
    public async Task UpdateAsync_NormalizesColors_ToLowercase()
    {
        var dto = await _service.UpdateAsync(new UpdateSiteSettingsDto
        {
            SiteName = "Blog",
            AccentColorLight = "#AABBCC",
        }, null);

        Assert.Equal("#aabbcc", dto.AccentColorLight);
    }

    [Fact]
    public async Task UpdateAsync_KeepsRowCountAtOne()
    {
        await _service.UpdateAsync(new UpdateSiteSettingsDto { SiteName = "One" }, null);
        await _service.UpdateAsync(new UpdateSiteSettingsDto { SiteName = "Two" }, null);

        var row = _context.SiteSettings.Single();
        Assert.Equal("Two", row.SiteName);
    }
}
