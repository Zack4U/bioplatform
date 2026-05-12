using Ganss.Xss;
using MediatR;

namespace Bio.Application.Behaviors;

/// <summary>
/// MediatR pipeline behavior that sanitizes string properties marked with
/// [SanitizeHtml] in DTOs, preventing stored XSS.
/// This is applied automatically to all IRequest commands.
/// </summary>
public class HtmlSanitizationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private static readonly HtmlSanitizer _sanitizer = new();

    static HtmlSanitizationBehavior()
    {
        // Allow common formatting tags but strip scripts, onclick, href=javascript:, etc.
        _sanitizer.AllowedTags.Add("b");
        _sanitizer.AllowedTags.Add("i");
        _sanitizer.AllowedTags.Add("u");
        _sanitizer.AllowedTags.Add("strong");
        _sanitizer.AllowedTags.Add("em");
        _sanitizer.AllowedTags.Add("p");
        _sanitizer.AllowedTags.Add("br");
        _sanitizer.AllowedTags.Add("ul");
        _sanitizer.AllowedTags.Add("ol");
        _sanitizer.AllowedTags.Add("li");
        _sanitizer.AllowedTags.Add("h2");
        _sanitizer.AllowedTags.Add("h3");
        _sanitizer.AllowedTags.Add("blockquote");
        _sanitizer.AllowedAttributes.Add("class");
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        SanitizeStringProperties(request);
        return await next();
    }

    private static void SanitizeStringProperties(object obj)
    {
        if (obj is null) return;

        // Sanitize all public string properties on the request and any nested DTO
        var type = obj.GetType();
        foreach (var prop in type.GetProperties())
        {
            if (!prop.CanRead) continue;

            if (prop.PropertyType == typeof(string))
            {
                if (!prop.CanWrite) continue;
                var val = prop.GetValue(obj) as string;
                if (!string.IsNullOrEmpty(val))
                    prop.SetValue(obj, _sanitizer.Sanitize(val));
            }
            else if (!prop.PropertyType.IsPrimitive
                     && prop.PropertyType != typeof(Guid)
                     && prop.PropertyType != typeof(DateTime)
                     && prop.PropertyType != typeof(decimal)
                     && !prop.PropertyType.IsEnum)
            {
                // Recurse into nested DTOs
                var nested = prop.GetValue(obj);
                if (nested is not null && nested.GetType().Namespace?.StartsWith("Bio") == true)
                    SanitizeStringProperties(nested);
            }
        }
    }
}
