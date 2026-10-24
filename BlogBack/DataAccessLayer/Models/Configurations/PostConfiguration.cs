using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Models.Configurations;

public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.Property(p => p.CategoryId).IsRequired();
        builder.Property(p => p.Content).IsRequired(false);

        builder.HasMany(p => p.Medias)
               .WithOne(m => m.Post)
               .HasForeignKey(m => m.PostId)
               .OnDelete(DeleteBehavior.Cascade);

        
    }
}