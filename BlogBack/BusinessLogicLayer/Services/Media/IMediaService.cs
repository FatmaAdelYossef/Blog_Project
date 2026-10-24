using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataAccessLayer.DTOs.Medias;

namespace BusinessLogicLayer.Services.Media;

public interface IMediaService
{
    Task<MediaResponseDto> AddMediaToPostAsync(int postId, CreateMediaDto dto);
    Task<bool> UpdateMediaAsync(int mediaId, CreateMediaDto dto);
    Task<bool> DeleteMediaAsync(int mediaId);
}