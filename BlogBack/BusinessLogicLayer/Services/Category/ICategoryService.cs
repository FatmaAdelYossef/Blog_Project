using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogicLayer.Services.Category;

public interface ICategoryService
{
    Task<IEnumerable<DataAccessLayer.Models.Category>> GetAllAsync();
    Task<DataAccessLayer.Models.Category?> GetByIdAsync(int id);
    Task<bool> CreateAsync(DataAccessLayer.Models.Category category);
    Task<bool> UpdateAsync(DataAccessLayer.Models.Category category);
    Task<bool> DeleteAsync(int id);
}