using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Context;

public class BlogDbContext : IdentityDbContext<ApplicationUser>
{
    public BlogDbContext(DbContextOptions<BlogDbContext> options) : base(options)
    {
    }

    public BlogDbContext()
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Birth dates are calendar dates; mapping them to `date` also avoids
        // Npgsql rejecting unspecified DateTime kinds for `timestamptz`.
        modelBuilder.Entity<ApplicationUser>()
            .Property(user => user.BirthDate)
            .HasColumnType("date");

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BlogDbContext).Assembly);
    }

    public DbSet<Post> Posts { get; set; }
    public DbSet<Media> Medias { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<SiteSettings> SiteSettings { get; set; }

}
