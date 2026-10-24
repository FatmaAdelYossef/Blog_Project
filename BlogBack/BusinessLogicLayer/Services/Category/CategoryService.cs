using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.Context;
using Microsoft.EntityFrameworkCore;

namespace BusinessLogicLayer.Services.Category;

public class CategoryService : ICategoryService
{
    private readonly BlogDbContext _context;

    public CategoryService(BlogDbContext context)
    {
        _context = context;
    }

    public async Task<bool> CreateAsync(DataAccessLayer.Models.Category category)
    {
        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Posts)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null) return false;

        if (category.Posts != null && category.Posts.Any())
        {
            throw new InvalidOperationException("Cannot delete this category because it has associated posts.");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<DataAccessLayer.Models.Category>> GetAllAsync()
    {
        return await _context.Categories.ToListAsync();
    }

    public async Task<DataAccessLayer.Models.Category?> GetByIdAsync(int id)
    {
        return await _context.Categories.FindAsync(id);
    }

    public async Task<bool> UpdateAsync(DataAccessLayer.Models.Category category)
    {
        var existing = await _context.Categories.FindAsync(category.Id);
        if (existing == null) return false;

        existing.Name = category.Name;
        await _context.SaveChangesAsync();
        return true;
    }
}
