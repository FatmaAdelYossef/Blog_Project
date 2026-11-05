using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.DTOs.Validation;

namespace DataAccessLayer.DTOs.Medias;

public class CreateMediaDto
{
    [Required(ErrorMessage = "Media URL is required")]
    [MediaUrl]
    [StringLength(2048, ErrorMessage = "Media URL must not exceed 2048 characters")]
    public string Url { get; set; } = string.Empty;

    [Required(ErrorMessage = "Media type is required")]
    [AllowedValues("Image", "Music", "Link", ErrorMessage = "Media type must be either Image, Music, or Link")]
    public string MediaType { get; set; } = "Image";
}
