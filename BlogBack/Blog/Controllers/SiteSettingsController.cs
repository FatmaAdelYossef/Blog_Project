using System.Security.Claims;
using BusinessLogicLayer.Services.SiteSettings;
using DataAccessLayer.DTOs.Response;
using DataAccessLayer.DTOs.SiteSettings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SharedLayer;

namespace Blog.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SiteSettingsController : ControllerBase
{
    private readonly ISiteSettingsService _siteSettingsService;

    public SiteSettingsController(ISiteSettingsService siteSettingsService)
    {
        _siteSettingsService = siteSettingsService;
    }

    // GET: api/site-settings — public so guests see the customized branding.
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<SiteSettingsDto>> Get()
    {
        var settings = await _siteSettingsService.GetAsync();
        return Ok(ApiResponse<SiteSettingsDto>.SuccessResult(settings));
    }

    // PUT: api/site-settings — blog owner only.
    [Authorize(Roles = AppRoles.Admin)]
    [HttpPut]
    public async Task<ActionResult<SiteSettingsDto>> Update(UpdateSiteSettingsDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse.BadRequestResponse(
                "Invalid site settings.",
                ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList()));
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var settings = await _siteSettingsService.UpdateAsync(dto, userId);
        return Ok(ApiResponse<SiteSettingsDto>.SuccessResult(settings, "Site settings updated."));
    }
}
