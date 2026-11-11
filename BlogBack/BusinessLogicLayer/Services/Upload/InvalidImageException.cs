namespace BusinessLogicLayer.Services.Upload;

public class InvalidImageException : Exception
{
    public InvalidImageException(string message) : base(message)
    {
    }
}
