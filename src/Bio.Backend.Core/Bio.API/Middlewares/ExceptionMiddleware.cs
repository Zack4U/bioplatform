using System.Net;
using System.Text.Json;
using Bio.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System.Security.Authentication;
using FluentValidation;

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
            Bio.Domain.Exceptions.ValidationException => (int)HttpStatusCode.BadRequest,
            FluentValidation.ValidationException => (int)HttpStatusCode.BadRequest,
            NotFoundException => (int)HttpStatusCode.NotFound,
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            ConflictException => (int)HttpStatusCode.Conflict,
            UnauthorizedException => (int)HttpStatusCode.Unauthorized,
            ForbiddenException => (int)HttpStatusCode.Forbidden,
            _ => (int)HttpStatusCode.InternalServerError
        };

        context.Response.StatusCode = statusCode;

        if (exception is FluentValidation.ValidationException fluentException)
        {
            var errors = fluentException.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray()
                );

            var validationProblemDetails = new ValidationProblemDetails(errors)
            {
                Status = statusCode,
                Title = "Validation Error",
                Detail = "One or more validation errors occurred.",
                Type = $"https://httpstatuses.com/{statusCode}"
            };

            return context.Response.WriteAsync(JsonSerializer.Serialize(validationProblemDetails));
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(statusCode),
            Detail = exception.Message,
            Type = $"https://httpstatuses.com/{statusCode}"
        };

        if (statusCode == (int)HttpStatusCode.InternalServerError)
        {
            problemDetails.Detail = "An unexpected error occurred while processing your request.";
        }

        return context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails));
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
