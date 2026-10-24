namespace Blog.Middleware;

/// <summary>
/// Applies security hardening headers to every response. The Content-Security-Policy
/// is opt-in so it can be omitted for Swagger UI in Development.
/// </summary>
public sealed class SecurityHeadersMiddleware
{
    private const string ContentSecurityPolicy =
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'";

    private readonly RequestDelegate _next;
    private readonly bool _includeContentSecurityPolicy;

    public SecurityHeadersMiddleware(RequestDelegate next, bool includeContentSecurityPolicy)
    {
        _next = next;
        _includeContentSecurityPolicy = includeContentSecurityPolicy;
    }

    public Task InvokeAsync(HttpContext context)
    {
        // Use OnStarting so the headers are applied after any downstream header changes
        // and survive the exception handler clearing the response before writing a 500.
        context.Response.OnStarting(static state =>
        {
            var (response, includeContentSecurityPolicy) =
                ((HttpResponse Response, bool IncludeContentSecurityPolicy))state;

            response.Headers["X-Content-Type-Options"] = "nosniff";
            response.Headers["X-Frame-Options"] = "DENY";
            response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            response.Headers["Cross-Origin-Resource-Policy"] = "same-site";
            response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

            if (includeContentSecurityPolicy)
            {
                response.Headers["Content-Security-Policy"] = ContentSecurityPolicy;
            }

            return Task.CompletedTask;
        }, (context.Response, _includeContentSecurityPolicy));

        return _next(context);
    }
}
