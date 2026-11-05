using System.ComponentModel.DataAnnotations;
using SharedLayer.Helpers;

namespace DataAccessLayer.DTOs.Validation;

/// <summary>
/// Accepts only safe media references: internal uploads (GUID file names),
/// site-relative paths, or absolute http(s) URLs. Blocks javascript:, data:,
/// file: and other executable/unknown URL schemes.
/// </summary>
public class MediaUrlAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        var url = value as string;

        if (string.IsNullOrWhiteSpace(url))
            return new ValidationResult("Media URL is required");

        if (PublicHelperShared.IsGuidFileName(url))
            return ValidationResult.Success;

        if (url.StartsWith('/'))
            return ValidationResult.Success;

        if (Uri.TryCreate(url, UriKind.Absolute, out var parsed)
            && (parsed.Scheme == Uri.UriSchemeHttp || parsed.Scheme == Uri.UriSchemeHttps))
        {
            return ValidationResult.Success;
        }

        return new ValidationResult(string.IsNullOrEmpty(ErrorMessage)
            ? "Media URL must be an uploaded file, a site-relative path, or an http(s) link."
            : ErrorMessage);
    }
}
