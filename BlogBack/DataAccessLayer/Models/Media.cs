using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccessLayer.Models;

public class Media
{
    public int Id { get; set; }
    public string? Url { get; set; } = string.Empty;
    public string MediaType { get; set; } = "Image";

    public int PostId { get; set; }
    public Post Post { get; set; } = null!;
}
