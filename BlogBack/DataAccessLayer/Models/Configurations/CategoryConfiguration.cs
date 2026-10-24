using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DataAccessLayer.Models.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(e => e.Id);

        builder.HasIndex(e => e.Name).IsUnique();

        builder.Property(e => e.Name).IsRequired().HasMaxLength(255);

        builder.HasMany(p => p.Posts)
               .WithOne(m => m.Category)
               .HasForeignKey(m => m.CategoryId)
               .OnDelete(DeleteBehavior.NoAction);
    }
}
