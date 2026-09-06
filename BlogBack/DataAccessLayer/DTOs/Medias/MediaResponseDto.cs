using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccessLayer.DTOs.Medias;

public class MediaResponseDto
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
}