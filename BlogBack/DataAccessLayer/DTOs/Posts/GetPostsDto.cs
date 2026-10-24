using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.DTOs.Pagenation;

namespace DataAccessLayer.DTOs.Posts;

public class GetPostsDto : PaginationParams
{
    public int? CategoryId { get; set; }
    public string? Title { get; set; }
}
