namespace DataAccessLayer.DTOs.Auth;

public class RefreshTokenRequestDto
{
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Refresh token is required")]
    public string RefreshToken { get; set; } = string.Empty;
}
