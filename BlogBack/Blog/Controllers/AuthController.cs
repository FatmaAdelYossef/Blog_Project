using BusinessLogicLayer.Services.Auth;
using DataAccessLayer.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using DataAccessLayer.DTOs.Auth;

namespace Blog.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            var token = await _authService.LoginAsync(dto);
            return Ok(ApiResponse<string>.SuccessResult(token, "Logged in successfully."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.BadRequestResponse(ex.Message));
        }
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized(ApiResponse.UnauthorizedResponse());

            await _authService.ChangePasswordAsync(userId, dto);
            return Ok(ApiResponse.SuccessResponse("Password changed successfully."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.BadRequestResponse(ex.Message));
        }
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            var result = await _authService.ForgotPasswordAsync(dto);
            if (!result) return NotFound(ApiResponse.NotFoundResponse("User not found or email error."));

            return Ok(ApiResponse.SuccessResponse("Reset token sent to your email."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.BadRequestResponse(ex.Message));
        }
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            await _authService.ResetPasswordAsync(dto);
            return Ok(ApiResponse.SuccessResponse("Password reset successfully."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse.BadRequestResponse(ex.Message));
        }
    }
}

