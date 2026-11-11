using BusinessLogicLayer.Services.Post;
using DataAccessLayer.Context;
using DataAccessLayer.DTOs.Medias;
using DataAccessLayer.DTOs.Posts;
using DataAccessLayer.Models;
using Microsoft.EntityFrameworkCore;
using SharedLayer;

namespace BlogBack.Tests;

public class PostServiceTests
{
    private readonly BlogDbContext _context;
    private readonly FakeUploadService _uploadService;
    private readonly Category _category;

    public PostServiceTests()
    {
        _context = TestDb.CreateContext();
        _category = new Category { Name = "Tech" };
        _context.Categories.Add(_category);
        _context.SaveChanges();
        _uploadService = new FakeUploadService();
    }

    private PostService ServiceFor(string? userId = null, params string[] roles) =>
        new(_context, TestHttp.AccessorForUser(userId, roles), _uploadService);

    private DataAccessLayer.Models.Post SeedPost(string authorId = "author-1")
    {
        var post = new DataAccessLayer.Models.Post
        {
            Title = "Hello",
            Content = "World",
            CategoryId = _category.Id,
            AuthorId = authorId,
            CreatedAt = DateTime.UtcNow,
            Medias = new List<Media>
            {
                new() { Url = "https://example.com/ext.png", MediaType = "Image" },
            },
        };
        _context.Posts.Add(post);
        _context.SaveChanges();
        return post;
    }

    [Fact]
    public async Task CreatePostAsync_Requires_AuthenticatedUser()
    {
        var service = ServiceFor(); // anonymous
        var dto = new CreatePostDto { Title = "T", CategoryId = _category.Id };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.CreatePostAsync(dto));
    }

    [Fact]
    public async Task CreatePostAsync_Rejects_UnknownCategory()
    {
        var service = ServiceFor("author-1");
        var dto = new CreatePostDto { Title = "T", CategoryId = 9999 };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreatePostAsync(dto));
        Assert.Contains("category", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreatePostAsync_Saves_WithAuthorId()
    {
        var service = ServiceFor("author-1");
        var dto = new CreatePostDto { Title = "New Post", Content = "Body", CategoryId = _category.Id };

        var result = await service.CreatePostAsync(dto);

        Assert.Equal("author-1", result.AuthorId);
        Assert.Equal("Tech", result.CategoryName);
    }

    [Fact]
    public async Task UpdatePostAsync_Rejects_NonOwner()
    {
        var post = SeedPost("author-1");
        var service = ServiceFor("author-2");
        var dto = new UpdatePostDto { Title = "Hijacked" };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.UpdatePostAsync(post.Id, dto));
    }

    [Fact]
    public async Task UpdatePostAsync_Allows_AdminOnOthersPost()
    {
        var post = SeedPost("author-1");
        var service = ServiceFor("admin-1", AppRoles.Admin);
        var dto = new UpdatePostDto { Title = "Admin edit" };

        var result = await service.UpdatePostAsync(post.Id, dto);

        Assert.Equal("Admin edit", result?.Title);
    }

    [Fact]
    public async Task DeletePostAsync_Deletes_AndCleansUploadedMedia()
    {
        var post = SeedPost("author-1");
        var guidMedia = new Media
        {
            Url = Guid.NewGuid().ToString("N") + ".png",
            MediaType = "Image",
            PostId = post.Id,
        };
        _context.Medias.Add(guidMedia);
        _context.SaveChanges();

        var service = ServiceFor("author-1");
        var deleted = await service.DeletePostAsync(post.Id);

        Assert.True(deleted);
        Assert.Empty(await _context.Posts.Where(p => p.Id == post.Id).ToListAsync());
        // Only the GUID-named file should reach the upload service.
        Assert.Contains(guidMedia.Url, _uploadService.DeletedUrls);
    }

    [Fact]
    public async Task GetPostIdsAsync_ReturnsIds_WithoutContent()
    {
        SeedPost();
        SeedPost();

        var service = ServiceFor();
        var ids = await service.GetPostIdsAsync();

        Assert.Equal(2, ids.Count);
    }

    [Fact]
    public async Task GetAllPostsAsync_Paginates_AndFilters()
    {
        SeedPost();
        SeedPost();

        var service = ServiceFor();
        var page = await service.GetAllPostsAsync(new GetPostsDto { PageNumber = 1, PageSize = 1 });

        Assert.Equal(1, page.Items.Count());
        Assert.Equal(2, page.TotalCount);
    }
}
