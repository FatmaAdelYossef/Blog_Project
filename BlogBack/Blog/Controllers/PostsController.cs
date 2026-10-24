using BusinessLogicLayer.Services.Media;
using BusinessLogicLayer.Services.Post;
using DataAccessLayer.DTOs.Medias;
using DataAccessLayer.DTOs.Pagenation;
using DataAccessLayer.DTOs.Posts;
using DataAccessLayer.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Blog.Controllers;


[Route("api/[controller]")]
[ApiController]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly IMediaService _mediaService;

    public PostsController(IPostService postService, IMediaService mediaService)
    {
        _postService = postService;
        _mediaService = mediaService;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAllPosts([FromQuery] GetPostsDto dto)
    {
        var posts = await _postService.GetAllPostsAsync(dto);
        return Ok(posts);
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPostById(int id)
    {
        var post = await _postService.GetPostByIdAsync(id);
        if (post == null)
            return NotFound(new { message = "Post not found" });

        return Ok(ApiResponse<object>.SuccessResult(post));
    }

    [HttpPost]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
    {
        var createdPost = await _postService.CreatePostAsync(dto);
        return CreatedAtAction(nameof(GetPostById), new { id = createdPost.Id }, createdPost);
    }

    [HttpPost("{postId}/media")]
    public async Task<IActionResult> AddMediaToPost(int postId, [FromBody] CreateMediaDto dto)
    {
        try
        {
            var media = await _mediaService.AddMediaToPostAsync(postId, dto);
            return Ok(ApiResponse<object>.SuccessResult(media));
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostDto dto)
    {
        var updatedPost = await _postService.UpdatePostAsync(id, dto);
        if (updatedPost == null)
            return NotFound(new { message = "Post not found" });

        return Ok(ApiResponse<object>.SuccessResult(updatedPost));
    }

    [HttpPut("Media/{mediaId}")]
    public async Task<IActionResult> UpdateMedia(int mediaId, [FromBody] CreateMediaDto dto)
    {
        var updatedPost = await _mediaService.UpdateMediaAsync(mediaId, dto);
        if (!updatedPost)
            return StatusCode(StatusCodes.Status500InternalServerError, "Failed to update media");

        return Ok(ApiResponse<object>.SuccessResult(updatedPost));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePost(int id)
    {
        var deleted = await _postService.DeletePostAsync(id);
        if (!deleted)
            return NotFound(new { message = "Post not found" });

        return Ok(ApiResponse.SuccessResponse("Post deleted successfully"));
    }

    [HttpDelete("Media/{id}")]
    public async Task<IActionResult> DeleteMedia(int id)
    {
        var deleted = await _mediaService.DeleteMediaAsync(id);
        if (!deleted)
            return NotFound(new { message = "Media not found" });

        return Ok(ApiResponse.SuccessResponse("Media deleted successfully"));
    }


}