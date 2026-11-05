using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.DTOs.Medias;

namespace DataAccessLayer.DTOs.Posts;

public class CreatePostDto
{
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Title is required")]
    [System.ComponentModel.DataAnnotations.StringLength(200, ErrorMessage = "Title must not exceed 200 characters")]
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public int CategoryId { get; set; }
    public List<CreateMediaDto> Medias { get; set; } = new List<CreateMediaDto>();
}
