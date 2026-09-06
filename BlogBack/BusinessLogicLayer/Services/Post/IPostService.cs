using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.DTOs.Pagenation;
using DataAccessLayer.DTOs.Posts;
using DataAccessLayer.Models;

namespace BusinessLogicLayer.Services.Post;

public interface IPostService
{
    Task<PostResponseDto> CreatePostAsync(CreatePostDto dto);
    Task<PagedResult<PostResponseDto>> GetAllPostsAsync(GetPostsDto dto);
    Task<PostResponseDto> GetPostByIdAsync(int id);
    Task<PostResponseDto?> UpdatePostAsync(int id, UpdatePostDto dto);
    Task<bool> DeletePostAsync(int id);
}