using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccessLayer.DTOs.Auth;

public class ForgotPasswordDto
{
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Email is required")]
    [System.ComponentModel.DataAnnotations.EmailAddress(ErrorMessage = "A valid email address is required")]
    [System.ComponentModel.DataAnnotations.StringLength(256)]
    public string Email { get; set; } = string.Empty;
}
