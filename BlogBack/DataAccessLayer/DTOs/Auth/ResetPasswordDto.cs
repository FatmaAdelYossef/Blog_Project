using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccessLayer.DTOs.Auth;

public class ResetPasswordDto
{
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Email is required")]
    [System.ComponentModel.DataAnnotations.EmailAddress(ErrorMessage = "A valid email address is required")]
    [System.ComponentModel.DataAnnotations.StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Reset token is required")]
    public string Token { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "A new password is required")]
    [System.ComponentModel.DataAnnotations.MinLength(12, ErrorMessage = "The new password must be at least 12 characters")]
    [System.ComponentModel.DataAnnotations.StringLength(256)]
    public string NewPassword { get; set; } = string.Empty;
}
