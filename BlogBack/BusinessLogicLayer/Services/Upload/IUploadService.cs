using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.DTOs.Download;
using Microsoft.AspNetCore.Http;

namespace BusinessLogicLayer.Services.Upload;

public interface IUploadService
{
    Task<string> UploadImageAsync(IFormFile file);
    FileDownloadResponse DownloadFile(string fileName);
}
