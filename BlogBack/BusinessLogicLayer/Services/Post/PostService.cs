using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BusinessLogicLayer.Services.Authorization;
using DataAccessLayer.Context;
using DataAccessLayer.DTOs.Medias;
using DataAccessLayer.DTOs.Pagenation;
using DataAccessLayer.DTOs.Posts;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SharedLayer.Helpers;

namespace BusinessLogicLayer.Services.Post;

public class PostService : IPostService
{
    private readonly BlogDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PostService(BlogDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<PostResponseDto> CreatePostAsync(CreatePostDto dto)
    {
        var authorId = PostAccess.GetUserId(_httpContextAccessor.HttpContext?.User);
        if (string.IsNullOrEmpty(authorId))
            throw new UnauthorizedAccessException("Authentication is required.");

        var post = new DataAccessLayer.Models.Post
        {
            Title = dto.Title,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow,
            CategoryId = dto.CategoryId,
            AuthorId = authorId,
            Medias = dto.Medias.Select(m => new DataAccessLayer.Models.Media
            {
                Url = m.Url,
                MediaType = m.MediaType
            }).ToList()
        };

        await _context.Posts.AddAsync(post);
        await _context.SaveChangesAsync();

        var request = _httpContextAccessor.HttpContext?.Request;
        var baseUrl = $"{request?.Scheme}://{request?.Host}";
        var categoryName = await GetCategoryNameAsync(post.CategoryId);

        return MapToPostResponseDto(post, baseUrl, categoryName);
    }

    public async Task<PagedResult<PostResponseDto>> GetAllPostsAsync(GetPostsDto dto)
    {
        var query = _context.Posts.AsQueryable();

        if (dto.CategoryId.HasValue) query = query.Where(e => e.CategoryId == dto.CategoryId);

        var title = dto.Title?.Trim();
        if (!string.IsNullOrWhiteSpace(title)) query = query.Where(e => e.Title.Contains(title));

        var totalCount = await query.CountAsync();

        var posts = await query
            .Include(p => p.Medias)
            .Include(p => p.Category)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((dto.PageNumber - 1) * dto.PageSize)
            .Take(dto.PageSize)
            .ToListAsync();

        var request = _httpContextAccessor.HttpContext?.Request;
        var baseUrl = $"{request?.Scheme}://{request?.Host}";

        var postDtos = posts
            .Select(p => MapToPostResponseDto(p, baseUrl, p.Category?.Name))
            .ToList();

        return new PagedResult<PostResponseDto>
        {
            PageNumber = dto.PageNumber,
            PageSize = dto.PageSize,
            TotalCount = totalCount,
            Items = postDtos,
        };
    }

    public async Task<PostResponseDto?> GetPostByIdAsync(int id)
    {
        var post = await _context.Posts
            .Include(p => p.Medias)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (post == null)
            return null;

        var request = _httpContextAccessor.HttpContext?.Request;
        var baseUrl = $"{request?.Scheme}://{request?.Host}";

        return MapToPostResponseDto(post, baseUrl, post.Category?.Name);
    }

    public async Task<PostResponseDto?> UpdatePostAsync(int id, UpdatePostDto dto)
    {
        var post = await _context.Posts
            .Include(p => p.Medias)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (post == null)
            return null;

        PostAccess.EnsureCanModify(_httpContextAccessor.HttpContext?.User, post.AuthorId);

        post.Title = dto.Title;
        post.Content = dto.Content;
        post.CategoryId = dto.CategoryId.HasValue ? dto.CategoryId.Value : post.CategoryId;

        _context.Posts.Update(post);
        await _context.SaveChangesAsync();

        var request = _httpContextAccessor.HttpContext?.Request;
        var baseUrl = $"{request?.Scheme}://{request?.Host}";
        var categoryName = await GetCategoryNameAsync(post.CategoryId);

        return MapToPostResponseDto(post, baseUrl, categoryName);
    }

    public async Task<bool> DeletePostAsync(int id)
    {
        var post = await _context.Posts.FindAsync(id);
        if (post == null)
            return false;

        PostAccess.EnsureCanModify(_httpContextAccessor.HttpContext?.User, post.AuthorId);

        _context.Posts.Remove(post);
        await _context.SaveChangesAsync();

        return true;
    }

    private async Task<string?> GetCategoryNameAsync(int categoryId)
    {
        return await _context.Categories
            .Where(c => c.Id == categoryId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync();
    }

    private static PostResponseDto MapToPostResponseDto(
        DataAccessLayer.Models.Post post,
        string baseUrl,
        string? categoryName)
    {
        return new PostResponseDto
        {
            Id = post.Id,
            CategoryId = post.CategoryId,
            CategoryName = categoryName,
            AuthorId = post.AuthorId,
            Title = post.Title,
            Content = post.Content,
            CreatedAt = post.CreatedAt,
            Medias = post.Medias!.Select(m => new MediaResponseDto
            {
                Id = m.Id,
                Url = PublicHelperShared.IsGuidFileName(m.Url)
                    ? $"{baseUrl}/api/Upload/download/{m.Url}"
                    : m.Url ?? string.Empty,
                MediaType = m.MediaType
            }).ToList()
        };
    }

}
