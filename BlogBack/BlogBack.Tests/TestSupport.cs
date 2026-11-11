using System.Security.Claims;
using BusinessLogicLayer.Services.Upload;
using DataAccessLayer.Context;
using DataAccessLayer.DTOs.Download;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

namespace BlogBack.Tests;

internal static class TestDb
{
    public static BlogDbContext CreateContext(string? name = null)
    {
        var options = new DbContextOptionsBuilder<BlogDbContext>()
            .UseInMemoryDatabase(name ?? Guid.NewGuid().ToString())
            .Options;
        return new BlogDbContext(options);
    }
}

internal sealed class TestWebHostEnvironment : IWebHostEnvironment
{
    public TestWebHostEnvironment(string? webRootPath = null)
    {
        var root = Path.Combine(Path.GetTempPath(), "blogback-tests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        ContentRootPath = root;
        WebRootPath = webRootPath ?? Path.Combine(root, "wwwroot");
        Directory.CreateDirectory(WebRootPath);
    }

    public string EnvironmentName { get; set; } = "Development";
    public string ApplicationName { get; set; } = "BlogBack.Tests";
    public string ContentRootPath { get; set; }
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    public string WebRootPath { get; set; }
}

internal sealed class FakeUploadService : IUploadService
{
    public List<string?> DeletedUrls { get; } = new();

    public bool TryDeleteUploadedFile(string? url)
    {
        DeletedUrls.Add(url);
        return true;
    }

    public Task<string> UploadImageAsync(IFormFile file) =>
        throw new NotImplementedException();

    public FileDownloadResponse DownloadFile(string fileName) =>
        throw new NotImplementedException();
}

internal static class TestHttp
{
    /// <summary>Builds an accessor whose HttpContext.User carries the given claims.</summary>
    public static IHttpContextAccessor AccessorForUser(string? userId = null, params string[] roles)
    {
        var claims = new List<Claim>();
        if (userId is not null)
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test")),
        };

        return new HttpContextAccessor { HttpContext = context };
    }
}
