using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.DTOs.Download;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;

namespace BusinessLogicLayer.Services.Upload;

public class UploadService : IUploadService
{
    private const long MaxFileSize = 5 * 1024 * 1024;
    private const int SignatureLength = 8;

    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif" };

    private readonly IWebHostEnvironment _environment;

    public UploadService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> UploadImageAsync(IFormFile file)
    {
        if (file is null)
            throw new InvalidImageException("No file uploaded.");

        if (string.IsNullOrWhiteSpace(file.FileName))
            throw new InvalidImageException("A file name is required.");

        if (file.Length == 0)
            throw new InvalidImageException("The uploaded file is empty.");

        if (file.Length > MaxFileSize)
            throw new InvalidImageException("File size exceeds the maximum limit of 5 MB.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new InvalidImageException("Invalid file type. Only images are allowed.");

        await using var source = file.OpenReadStream();
        MemoryStream? buffer = null;

        try
        {
            Stream content = source;

            if (!source.CanSeek)
            {
                buffer = new MemoryStream();
                await CopyToWithLimitAsync(source, buffer);
                buffer.Position = 0;
                content = buffer;
            }

            var signature = new byte[SignatureLength];
            var signatureBytesRead = await ReadSignatureAsync(content, signature);
            content.Position = 0;

            var detectedFormat = DetectFormat(signature.AsSpan(0, signatureBytesRead));
            if (detectedFormat is null)
                throw new InvalidImageException("The uploaded file is not a valid image.");

            if (!ExtensionMatchesFormat(extension, detectedFormat.Value))
                throw new InvalidImageException("The file content does not match its extension.");

            var storedExtension = detectedFormat.Value switch
            {
                ImageFormat.Jpeg => ".jpg",
                ImageFormat.Png => ".png",
                ImageFormat.Gif => ".gif",
                _ => throw new InvalidImageException("The uploaded file is not a valid image.")
            };

            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var uploadsFolder = Path.Combine(webRoot, "images");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString("N") + storedExtension;
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await content.CopyToAsync(fileStream);
            }

            return uniqueFileName;
        }
        finally
        {
            buffer?.Dispose();
        }
    }

    private static async Task<int> ReadSignatureAsync(Stream stream, byte[] signature)
    {
        var totalRead = 0;

        while (totalRead < signature.Length)
        {
            var read = await stream.ReadAsync(signature.AsMemory(totalRead, signature.Length - totalRead));
            if (read == 0)
                break;

            totalRead += read;
        }

        return totalRead;
    }

    private static async Task CopyToWithLimitAsync(Stream source, Stream destination)
    {
        var buffer = new byte[81920];
        long totalRead = 0;

        int read;
        while ((read = await source.ReadAsync(buffer.AsMemory())) > 0)
        {
            totalRead += read;
            if (totalRead > MaxFileSize)
                throw new InvalidImageException("File size exceeds the maximum limit of 5 MB.");

            await destination.WriteAsync(buffer.AsMemory(0, read));
        }
    }

    private static ImageFormat? DetectFormat(ReadOnlySpan<byte> signature)
    {
        if (signature.Length >= 3 && signature[0] == 0xFF && signature[1] == 0xD8 && signature[2] == 0xFF)
            return ImageFormat.Jpeg;

        if (signature.Length >= 8 &&
            signature[0] == 0x89 && signature[1] == 0x50 && signature[2] == 0x4E && signature[3] == 0x47 &&
            signature[4] == 0x0D && signature[5] == 0x0A && signature[6] == 0x1A && signature[7] == 0x0A)
            return ImageFormat.Png;

        if (signature.Length >= 6 &&
            signature[0] == (byte)'G' && signature[1] == (byte)'I' && signature[2] == (byte)'F' &&
            signature[3] == (byte)'8' && (signature[4] == (byte)'7' || signature[4] == (byte)'9') &&
            signature[5] == (byte)'a')
            return ImageFormat.Gif;

        return null;
    }

    private static bool ExtensionMatchesFormat(string extension, ImageFormat format)
    {
        return format switch
        {
            ImageFormat.Jpeg => extension is ".jpg" or ".jpeg",
            ImageFormat.Png => extension == ".png",
            ImageFormat.Gif => extension == ".gif",
            _ => false
        };
    }

    private enum ImageFormat
    {
        Jpeg,
        Png,
        Gif
    }

    public FileDownloadResponse DownloadFile(string fileName)
    {
        var safeFileName = Path.GetFileName(fileName);
        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var filePath = Path.Combine(webRoot, "images", safeFileName);

        if (!File.Exists(filePath))
            throw new FileNotFoundException("File not found.");

        var fileBytes = File.ReadAllBytes(filePath);

        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(filePath, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return new FileDownloadResponse
        {
            FileBytes = fileBytes,
            ContentType = contentType,
            FileName = safeFileName
        };
    }

}
