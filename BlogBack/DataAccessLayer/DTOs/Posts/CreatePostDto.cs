using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.DTOs.Medias;

namespace DataAccessLayer.DTOs.Posts;

public class CreatePostDto
{
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public int CategoryId { get; set; }
    public List<CreateMediaDto> Medias { get; set; } = new List<CreateMediaDto>();
}
