using BusinessLogicLayer.Services.Auth;
using DataAccessLayer.DTOs.Auth;
using DataAccessLayer.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace Blog.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            var tokens = await _authService.LoginAsync(dto);
            return Ok(ApiResponse<LoginResponseDto>.SuccessResult(tokens, "Logged in successfully."));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(ApiResponse.UnauthorizedResponse("Invalid email or password."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during login.");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse.ServerErrorResponse("An unexpected error occurred. Please try again later."));
        }
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto)
    {
        try
        {
            var tokens = await _authService.RefreshTokenAsync(dto);
            return Ok(ApiResponse<LoginResponseDto>.SuccessResult(tokens, "Token refreshed successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse.UnauthorizedResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during token refresh.");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse.ServerErrorResponse("An unexpected error occurred. Please try again later."));
        }
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequestDto? dto)
    {
        // Idempotent and anonymous-safe: revoking an unknown/expired token is a no-op.
        await _authService.LogoutAsync(dto);
        return Ok(ApiResponse.SuccessResponse("Logged out successfully."));
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.BadRequestResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during password change.");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse.ServerErrorResponse("An unexpected error occurred. Please try again later."));
        }
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            // Always return the same response regardless of whether the account exists,
            // to prevent email enumeration. Infrastructure failures are not masked.
            await _authService.ForgotPasswordAsync(dto);
            return Ok(ApiResponse.SuccessResponse("If the email exists, a reset link has been sent."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during forgot-password request.");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse.ServerErrorResponse("An unexpected error occurred. Please try again later."));
        }
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            await _authService.ResetPasswordAsync(dto);
            return Ok(ApiResponse.SuccessResponse("Password reset successfully."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse.BadRequestResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during password reset.");
            return StatusCode(StatusCodes.Status500InternalServerError,
                ApiResponse.ServerErrorResponse("An unexpected error occurred. Please try again later."));
        }
    }
}
