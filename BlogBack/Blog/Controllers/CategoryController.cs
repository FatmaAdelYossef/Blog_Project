using BusinessLogicLayer.Services.Category;
using DataAccessLayer.DTOs.Response;
using DataAccessLayer.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Blog.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoryController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoryController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    // GET: api/category
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetAll()
    {
        var categories = await _categoryService.GetAllAsync();
        return Ok(ApiResponse<object>.SuccessResult(categories));
    }

    // GET: api/category/5
    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<ActionResult<Category>> GetById(int id)
    {
        var category = await _categoryService.GetByIdAsync(id);
        if (category == null) return NotFound();
        return Ok(category);
    }

    // POST: api/category
    [HttpPost]
    public async Task<ActionResult<Category>> Create(Category category)
    {
        var createdCategory = await _categoryService.CreateAsync(category);
        return Ok("Category created successfully");
    }

    // PUT: api/category/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Category category)
    {
        if (id != category.Id) return BadRequest("ID mismatch");

        var result = await _categoryService.UpdateAsync(category);
        if (!result) return NotFound();

        return NoContent();
    }

    // DELETE: api/category/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _categoryService.DeleteAsync(id);
        if (!result) return NotFound();

        return NoContent();
    }
}