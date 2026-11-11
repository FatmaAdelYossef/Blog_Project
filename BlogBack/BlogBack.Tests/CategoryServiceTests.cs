using BusinessLogicLayer.Services.Category;
using DataAccessLayer.Context;
using DataAccessLayer.Models;

namespace BlogBack.Tests;

public class CategoryServiceTests
{
    private readonly BlogDbContext _context;
    private readonly CategoryService _service;

    public CategoryServiceTests()
    {
        _context = TestDb.CreateContext();
        _service = new CategoryService(_context);
    }

    [Fact]
    public async Task CreateAsync_ReturnsEntity_WithId()
    {
        var category = await _service.CreateAsync(new Category { Name = "News" });

        Assert.True(category.Id > 0);
        Assert.Equal("News", category.Name);
    }

    [Fact]
    public async Task DeleteAsync_Removes_EmptyCategory()
    {
        var category = await _service.CreateAsync(new Category { Name = "Empty" });

        Assert.True(await _service.DeleteAsync(category.Id));
        Assert.Null(await _context.Categories.FindAsync(category.Id));
    }

    [Fact]
    public async Task DeleteAsync_Throws_WhenCategoryHasPosts()
    {
        var category = await _service.CreateAsync(new Category { Name = "Busy" });
        _context.Posts.Add(new Post
        {
            Title = "P",
            CategoryId = category.Id,
            AuthorId = "a",
            CreatedAt = DateTime.UtcNow,
        });
        await _context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.DeleteAsync(category.Id));
    }

    [Fact]
    public async Task UpdateAsync_ReturnsFalse_ForMissingCategory()
    {
        var result = await _service.UpdateAsync(new Category { Id = 999, Name = "Ghost" });
        Assert.False(result);
    }
}
