using BusinessLogicLayer.Services.Upload;
using DataAccessLayer.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Blog.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UploadController : ControllerBase
{
    private readonly IUploadService _uploadService;
    private readonly ILogger<UploadController> _logger;

    public UploadController(IUploadService uploadService, ILogger<UploadController> logger)
    {
        _uploadService = uploadService;
        _logger = logger;
    }

    [EnableRateLimiting("upload")]
    [HttpPost("image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        try
        {
            var uniqueFileName = await _uploadService.UploadImageAsync(file);

            return Ok(ApiResponse<object>.SuccessResult(new
            {
                message = "Image uploaded successfully",
                fileName = uniqueFileName,
            }));
        }
        catch (InvalidImageException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while uploading an image.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred while uploading the image." });
        }
    }

    [AllowAnonymous]
    [HttpGet("download/{fileName}")]
    public IActionResult DownloadImage(string fileName)
    {
        try
        {
            var fileData = _uploadService.DownloadFile(fileName);

            return File(fileData.FileBytes, fileData.ContentType);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "File not found." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while downloading an image.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred while downloading the image." });
        }
    }

}
