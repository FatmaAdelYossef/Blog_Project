using System.Text;
using BusinessLogicLayer.Services.Post;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Blog.Controllers;

/// <summary>
/// Serves re-SER crawl files as first-class URLs on the site root (the frontend
/// nginx container proxies /robots.txt and /sitemap.xml here). The public URL
/// comes from Frontend:Origin — the same source used for CORS and reset links.
/// The SPA itself lives in BlogFront; these endpoints only need absolute URLs.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SeoController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public SeoController(IPostService postService, IConfiguration configuration, IWebHostEnvironment environment)
    {
        _postService = postService;
        _configuration = configuration;
        _environment = environment;
    }

    [AllowAnonymous]
    [HttpGet("sitemap.xml")]
    public async Task<IActionResult> Sitemap()
    {
        var baseOrigin = ResolveFrontendOrigin();
        if (baseOrigin is null)
        {
            return NotFound(new { message = "Frontend:Origin is not configured for the sitemap." });
        }

        var urls = new List<string>
        {
            BuildUrl(baseOrigin, "/"),
            BuildUrl(baseOrigin, "/posts"),
            BuildUrl(baseOrigin, "/categories"),
        };

        var postIds = await _postService.GetPostIdsAsync();
        urls.AddRange(postIds.Select(id => BuildUrl(baseOrigin, $"/posts/{id}")));

        var xml = new StringBuilder();
        xml.Append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        xml.Append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
        foreach (var url in urls)
        {
            xml.Append("<url><loc>").Append(url).Append("</loc></url>");
        }
        xml.Append("</urlset>");

        return Content(xml.ToString(), "application/xml; charset=utf-8");
    }

    [AllowAnonymous]
    [HttpGet("robots.txt")]
    public IActionResult Robots()
    {
        var lines = new List<string>
        {
            "User-agent: *",
            "Disallow: /login",
            "Disallow: /forgot-password",
            "Disallow: /reset-password",
            "Disallow: /change-password",
        };

        var baseOrigin = ResolveFrontendOrigin();
        if (baseOrigin is not null)
        {
            lines.Add($"Sitemap: {baseOrigin}/sitemap.xml");
        }

        return Content(string.Join('\n', lines), "text/plain; charset=utf-8");
    }

    /// <summary>Attracts a public origin string; null when not configured yet.</summary>
    private string? ResolveFrontendOrigin()
    {
        var origin = _configuration["Frontend:Origin"];
        if (string.IsNullOrWhiteSpace(origin)) return null;

        // Build-time value should be the absolute https URL once a domain exists.
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var parsed))
            return null;

        return parsed.GetLeftPart(UriPartial.Authority);
    }

    private static string BuildUrl(string baseOrigin, string path) => $"{baseOrigin}{path}";
}
