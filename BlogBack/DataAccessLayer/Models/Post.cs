using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccessLayer.Models;

public class Post
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Nullable so existing rows survive the migration; unowned posts are admin-only.
    public string? AuthorId { get; set; }

    public ApplicationUser? Author { get; set; }
    public Category? Category { get; set; }
    public ICollection<Media>? Medias { get; set; } = new List<Media>();
}
