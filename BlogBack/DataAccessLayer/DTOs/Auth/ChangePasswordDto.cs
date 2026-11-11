using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccessLayer.DTOs.Auth;

public class ChangePasswordDto
{
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Current password is required")]
    [System.ComponentModel.DataAnnotations.StringLength(256)]
    public string CurrentPassword { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "A new password is required")]
    [System.ComponentModel.DataAnnotations.MinLength(12, ErrorMessage = "The new password must be at least 12 characters")]
    [System.ComponentModel.DataAnnotations.StringLength(256)]
    public string NewPassword { get; set; } = string.Empty;
}