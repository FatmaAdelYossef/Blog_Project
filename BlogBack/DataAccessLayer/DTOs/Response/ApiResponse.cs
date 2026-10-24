namespace DataAccessLayer.DTOs.Response;

public class ApiResponse
{
    public bool Success { get; set; }
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string>? Errors { get; set; }

    public static ApiResponse SuccessResponse(string message = "Operation completed successfully", int statusCode = 200)
    {
        return new ApiResponse
        {
            Success = true,
            StatusCode = statusCode,
            Message = message
        };
    }

    public static ApiResponse CreatedResponse(string message = "Resource created successfully")
    {
        return SuccessResponse(message, 201);
    }

    public static ApiResponse FailureResponse(string message, int statusCode = 400, List<string>? errors = null)
    {
        return new ApiResponse
        {
            Success = false,
            StatusCode = statusCode,
            Message = message,
            Errors = errors
        };
    }

    public static ApiResponse BadRequestResponse(string message = "Bad Request", List<string>? errors = null)
    {
        return FailureResponse(message, 400, errors);
    }

    public static ApiResponse UnauthorizedResponse(string message = "Unauthorized access")
    {
        return FailureResponse(message, 401);
    }

    public static ApiResponse NotFoundResponse(string message = "Resource not found")
    {
        return FailureResponse(message, 404);
    }

    public static ApiResponse ServerErrorResponse(string message = "Internal server error", List<string>? errors = null)
    {
        return FailureResponse(message, 500, errors);
    }
}

public class ApiResponse<T> : ApiResponse
{
    public T? Data { get; set; }

    public static ApiResponse<T> SuccessResult(T data, string message = "Success", int statusCode = 200)
    {
        return new ApiResponse<T>
        {
            Success = true,
            StatusCode = statusCode,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> CreatedResult(T data, string message = "Resource created successfully")
    {
        return SuccessResult(data, message, 201);
    }

    public static ApiResponse<T> FailureResult(string message, int statusCode = 400, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            StatusCode = statusCode,
            Message = message,
            Errors = errors,
            Data = default
        };
    }

    public static ApiResponse<T> BadRequestResult(string message = "Bad Request", List<string>? errors = null)
    {
        return FailureResult(message, 400, errors);
    }

    public static ApiResponse<T> UnauthorizedResult(string message = "Unauthorized access")
    {
        return FailureResult(message, 401);
    }

    public static ApiResponse<T> NotFoundResult(string message = "Resource not found")
    {
        return FailureResult(message, 404);
    }

    public static ApiResponse<T> ServerErrorResult(string message = "Internal server error", List<string>? errors = null)
    {
        return FailureResult(message, 500, errors);
    }
}