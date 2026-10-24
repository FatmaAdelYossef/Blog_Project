using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.Context;
using DataAccessLayer.DTOs.Medias;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SharedLayer.Helpers;

namespace BusinessLogicLayer.Services.Media;

public class MediaService : IMediaService
{
    private readonly BlogDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public MediaService(BlogDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<MediaResponseDto> AddMediaToPostAsync(int postId, CreateMediaDto dto)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null)
            throw new Exception("Post not found");

        var media = new DataAccessLayer.Models.Media
        {
            Url = dto.Url,
            MediaType = dto.MediaType,
            PostId = postId
        };

        await _context.Medias.AddAsync(media);
        await _context.SaveChangesAsync();

        var request = _httpContextAccessor.HttpContext?.Request;
        var baseUrl = $"{request?.Scheme}://{request?.Host}";

        var finalUrl = PublicHelperShared.IsGuidFileName(media.Url)
            ? $"{baseUrl}/api/Upload/download/{media.Url}"
            : media.Url;

        return new MediaResponseDto
        {
            Id = media.Id,
            Url = finalUrl,
            MediaType = media.MediaType
        };
    }

    public async Task<bool> DeleteMediaAsync(int mediaId)
    {
        var media = await _context.Medias.FindAsync(mediaId);
        if (media == null)
            return false;

        _context.Medias.Remove(media);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateMediaAsync(int mediaId, CreateMediaDto dto)
    {
        var media = await _context.Medias.FirstOrDefaultAsync(p => p.Id == mediaId);

        if (media == null)
            return false;

        media.Url = dto.Url;
        media.MediaType = dto.MediaType;

        _context.Medias.Update(media);
        await _context.SaveChangesAsync();

        return true;
    }
}
