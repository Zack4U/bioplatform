using System.Net;
using System.Text.Json;
using Bio.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System.Security.Authentication;

namespace Bio.API.Middlewares;

/// <summary>
/// Global exception handling middleware that catches unhandled exceptions 
/// and maps them to appropriate HTTP status codes and standard ProblemDetails responses.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext httpContext)
    {
        try
        {
            await _next(httpContext);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception has occurred: {Message}", ex.Message);
            await HandleExceptionAsync(httpContext, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = exception switch
        {
            ArgumentException => (int)HttpStatusCode.BadRequest,
            ValidationException => (int)HttpStatusCode.BadRequest,
            NotFoundException => (int)HttpStatusCode.NotFound,
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            ConflictException => (int)HttpStatusCode.Conflict,
            UnauthorizedException => (int)HttpStatusCode.Unauthorized,
            ForbiddenException => (int)HttpStatusCode.Forbidden,
            _ => (int)HttpStatusCode.InternalServerError
        };

        context.Response.StatusCode = statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(statusCode),
            Detail = exception.Message,
            Type = $"https://httpstatuses.com/{statusCode}"
        };

        // In a real production environment, you might want to hide internal server error details.
        if (statusCode == (int)HttpStatusCode.InternalServerError)
        {
            problemDetails.Detail = "An unexpected error occurred while processing your request.";
        }

        var result = JsonSerializer.Serialize(problemDetails);
        return context.Response.WriteAsync(result);
    }

    private static string GetTitle(int statusCode)
    {
        return statusCode switch
        {
            (int)HttpStatusCode.BadRequest => "Bad Request",
            (int)HttpStatusCode.NotFound => "Not Found",
            (int)HttpStatusCode.Conflict => "Conflict",
            (int)HttpStatusCode.Unauthorized => "Unauthorized",
            (int)HttpStatusCode.Forbidden => "Forbidden",
            _ => "Internal Server Error"
        };
    }
}
