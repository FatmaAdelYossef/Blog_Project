using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.Context;
using DataAccessLayer.Models;
using DataAccessLayer.Seeders.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DataAccessLayer.Seeders.Classes;


public class BlogSeeder : ISeeder
{
    public async Task SeedAsync(IServiceProvider services)
    {
        var context = services.GetRequiredService<BlogDbContext>();

        if (!await context.Categories.AnyAsync())
        {
            var techCategory = new Category { Name = "Technology" };
            var lifeCategory = new Category { Name = "Lifestyle" };

            context.Categories.AddRange(techCategory, lifeCategory);
            await context.SaveChangesAsync();

            var samplePosts = new List<Post>
            {
                new Post
                {
                    Title = "Welcome to my new blog!",
                    Content = "This is the first post on my blog...",
                    CreatedAt = DateTime.UtcNow,
                    Category = techCategory,
                    Medias = new List<Media>
                    {
                        new Media { Url = "https://example.com/images/intro.jpg", MediaType = "Image" }
                    }
                },
                new Post
                {
                    Title = "My Favorite Coding Playlist",
                    Content = "Here are some great music tracks...",
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    Category = lifeCategory,
                    Medias = new List<Media>
                    {
                        new Media { Url = "https://youtube.com/watch?v=example", MediaType = "Link" }
                    }
                }
            };

            await context.Posts.AddRangeAsync(samplePosts);
            await context.SaveChangesAsync();
        }
    }
}