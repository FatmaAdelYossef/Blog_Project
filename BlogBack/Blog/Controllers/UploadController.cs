using BusinessLogicLayer.Services.Upload;
using DataAccessLayer.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Blog.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UploadController : ControllerBase
{
    private readonly IUploadService _uploadService;

    public UploadController(IUploadService uploadService)
    {
        _uploadService = uploadService;
    }

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
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
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
            return BadRequest(new { message = ex.Message });
        }
    }

}
