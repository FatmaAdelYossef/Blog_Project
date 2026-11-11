using BusinessLogicLayer.Services.Upload;
using Microsoft.AspNetCore.Http;

namespace BlogBack.Tests;

public class UploadServiceTests : IDisposable
{
    private readonly string _root;
    private readonly UploadService _service;

    private static readonly byte[] PngBytes =
    {
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    };

    private static readonly byte[] JpegBytes = { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10 };

    public UploadServiceTests()
    {
        _root = Path.Combine(Path.GetTempPath(), "blogback-upload-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_root);
        _service = new UploadService(new TestWebHostEnvironment(_root));
    }

    public void Dispose()
    {
        try { Directory.Delete(_root, recursive: true); } catch { /* best effort */ }
    }

    private static IFormFile MakeFile(string fileName, byte[] content) =>
        new FormFile(new MemoryStream(content), 0, content.Length, "file", fileName);

    [Fact]
    public async Task UploadImageAsync_Accepts_ValidPng()
    {
        var name = await _service.UploadImageAsync(MakeFile("photo.png", PngBytes));

        Assert.EndsWith(".png", name);
        Assert.True(File.Exists(Path.Combine(_root, "images", name)));
    }

    [Fact]
    public async Task UploadImageAsync_Rejects_NonImageContent()
    {
        var ex = await Assert.ThrowsAsync<InvalidImageException>(() =>
            _service.UploadImageAsync(MakeFile("evil.png", "<html>not an image</html>"u8.ToArray())));
        Assert.Contains("not a valid image", ex.Message);
    }

    [Fact]
    public async Task UploadImageAsync_Rejects_ExtensionContentMismatch()
    {
        // JPEG bytes claiming to be a PNG.
        var ex = await Assert.ThrowsAsync<InvalidImageException>(() =>
            _service.UploadImageAsync(MakeFile("fake.png", JpegBytes)));
        Assert.Contains("does not match", ex.Message);
    }

    [Fact]
    public async Task UploadImageAsync_Rejects_DisallowedExtension()
    {
        await Assert.ThrowsAsync<InvalidImageException>(() =>
            _service.UploadImageAsync(MakeFile("shell.aspx", PngBytes)));
    }

    [Fact]
    public async Task UploadImageAsync_Rejects_OversizedFile()
    {
        var big = new byte[5 * 1024 * 1024 + 1];
        PngBytes.CopyTo(big, 0);

        await Assert.ThrowsAsync<InvalidImageException>(() =>
            _service.UploadImageAsync(MakeFile("big.png", big)));
    }

    [Fact]
    public async Task UploadImageAsync_Rejects_EmptyFile()
    {
        await Assert.ThrowsAsync<InvalidImageException>(() =>
            _service.UploadImageAsync(MakeFile("empty.png", Array.Empty<byte>())));
    }

    [Fact]
    public void TryDeleteUploadedFile_Deletes_GuidNamedFile_Only()
    {
        var imagesDir = Path.Combine(_root, "images");
        Directory.CreateDirectory(imagesDir);
        var guidName = Guid.NewGuid().ToString("N") + ".png";
        var path = Path.Combine(imagesDir, guidName);
        File.WriteAllBytes(path, PngBytes);

        Assert.True(_service.TryDeleteUploadedFile(guidName));
        Assert.False(File.Exists(path));

        // External URLs and traversal attempts are ignored.
        Assert.False(_service.TryDeleteUploadedFile("https://example.com/x.png"));
        Assert.False(_service.TryDeleteUploadedFile("../../etc/passwd"));
        Assert.False(_service.TryDeleteUploadedFile(null));
    }
}
