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
    private readonly IWebHostEnvironment _environment;

    public UploadService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> UploadImageAsync(IFormFile file)
    {
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
        var extension = Path.GetExtension(file.FileName).ToLower();

        if (!allowedExtensions.Contains(extension))
            throw new Exception("Invalid file type. Only images are allowed.");

        const long maxFileSize = 5 * 1024 * 1024;
        if (file.Length > maxFileSize)
            throw new Exception("File size exceeds the maximum limit of 5 MB.");

        var uploadsFolder = Path.Combine(_environment.WebRootPath, "images");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = Guid.NewGuid().ToString("N") + extension;
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(fileStream);
        }

        return uniqueFileName;
    }

    public FileDownloadResponse DownloadFile(string fileName)
    {
        var safeFileName = Path.GetFileName(fileName);
        var filePath = Path.Combine(_environment.WebRootPath, "images", safeFileName);

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
