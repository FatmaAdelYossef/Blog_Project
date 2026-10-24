using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccessLayer.DTOs.Medias;

public class CreateMediaDto
{
    [Required(ErrorMessage = "Media URL is required")]
    public string Url { get; set; } = string.Empty;

    [Required(ErrorMessage = "Media type is required")]
    [AllowedValues("Image", "Music", "Link", ErrorMessage = "Media type must be either Image, Music, or Link")]
    public string MediaType { get; set; } = "Image";
}