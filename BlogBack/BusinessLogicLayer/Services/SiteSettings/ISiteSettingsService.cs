using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogicLayer.Services.SiteSettings;

public interface ISiteSettingsService
{
    Task<DataAccessLayer.DTOs.SiteSettings.SiteSettingsDto> GetAsync();
    Task<DataAccessLayer.DTOs.SiteSettings.SiteSettingsDto> UpdateAsync(
        DataAccessLayer.DTOs.SiteSettings.UpdateSiteSettingsDto dto, string? userId);
}
