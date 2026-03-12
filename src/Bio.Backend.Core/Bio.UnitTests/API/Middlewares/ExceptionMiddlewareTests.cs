using System.Net;
using System.Text.Json;
using Bio.API.Middlewares;
using Bio.Domain.Exceptions;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Bio.UnitTests.API.Middlewares;

/// <summary>
/// Unit tests for the <see cref="ExceptionMiddleware"/>.
/// Verifies that exceptions are correctly caught, logged, and mapped to the appropriate HTTP status codes and ProblemDetails responses.
/// </summary>
public class ExceptionMiddlewareTests
{
    /// <summary>
    /// Mocks for the logger and HTTP context.
    /// </summary>
    private readonly Mock<ILogger<ExceptionMiddleware>> _loggerMock;
    private readonly DefaultHttpContext _httpContext;

    /// <summary>
    /// Initializes a new instance of the <see cref="ExceptionMiddlewareTests"/> class.
    /// </summary>
    public ExceptionMiddlewareTests()
    {
        _loggerMock = new Mock<ILogger<ExceptionMiddleware>>();
        _httpContext = new DefaultHttpContext();

        // Ensure the response body is readable stream for assertions
        _httpContext.Response.Body = new MemoryStream();
    }

    /// <summary>
    /// Creates a new instance of the <see cref="ExceptionMiddleware"/> class.
    /// </summary>
    /// <summary>
    /// Creates a new instance of the <see cref="ExceptionMiddleware"/> class.
    /// </summary>
    private ExceptionMiddleware CreateMiddleware(RequestDelegate next)
    {
        return new ExceptionMiddleware(next, _loggerMock.Object);
    }

    /// <summary>
    /// Gets the response body as a <see cref="ProblemDetails"/> object.
    /// </summary>
    private async Task<ProblemDetails?> GetResponseBodyAsProblemDetailsAsync()
    {
        _httpContext.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(_httpContext.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        return JsonSerializer.Deserialize<ProblemDetails>(responseBody, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    /// <summary>
    /// Tests for mapping specific Domain and Standard Exceptions to their corresponding HTTP Status Codes.
    /// </summary>
    public class ExceptionMapping : ExceptionMiddlewareTests
    {
        /// <summary>
        /// Verifies that an ArgumentException is mapped to a 400 Bad Request.
        /// </summary>
        [Fact]
        public async Task InvokeAsync_ShouldReturnBadRequest_WhenArgumentExceptionIsThrown()
        {
            // Arrange
            var exceptionMessage = "Invalid argument provided.";
            var middleware = CreateMiddleware(innerHttpContext => throw new ArgumentException(exceptionMessage));

            // Act
            await middleware.InvokeAsync(_httpContext);

            // Assert
            _httpContext.Response.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            _httpContext.Response.ContentType.Should().Be("application/json");

            var problemDetails = await GetResponseBodyAsProblemDetailsAsync();
            problemDetails.Should().NotBeNull();
            problemDetails!.Status.Should().Be((int)HttpStatusCode.BadRequest);
            problemDetails.Title.Should().Be("Bad Request");
            problemDetails.Detail.Should().Be(exceptionMessage);
        }

        /// <summary>
        /// Verifies that a ValidationException is mapped to a 400 Bad Request.
        /// </summary>
        [Fact]
        public async Task InvokeAsync_ShouldReturnBadRequest_WhenValidationExceptionIsThrown()
        {
            // Arrange
            var exceptionMessage = "Domain validation failed.";
            var middleware = CreateMiddleware(innerHttpContext => throw new ValidationException(exceptionMessage));

            // Act
            await middleware.InvokeAsync(_httpContext);

            // Assert
            _httpContext.Response.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);

            var problemDetails = await GetResponseBodyAsProblemDetailsAsync();
            problemDetails.Should().NotBeNull();
            problemDetails!.Status.Should().Be((int)HttpStatusCode.BadRequest);
            problemDetails.Title.Should().Be("Bad Request");
            problemDetails.Detail.Should().Be(exceptionMessage);
        }

        /// <summary>
        /// Verifies that a KeyNotFoundException is mapped to a 404 Not Found.
        /// </summary>
        [Fact]
        public async Task InvokeAsync_ShouldReturnNotFound_WhenKeyNotFoundExceptionIsThrown()
        {
            // Arrange
            var exceptionMessage = "Resource not found.";
            var middleware = CreateMiddleware(innerHttpContext => throw new KeyNotFoundException(exceptionMessage));

            // Act
            await middleware.InvokeAsync(_httpContext);

            // Assert
            _httpContext.Response.StatusCode.Should().Be((int)HttpStatusCode.NotFound);

            var problemDetails = await GetResponseBodyAsProblemDetailsAsync();
            problemDetails.Should().NotBeNull();
            problemDetails!.Status.Should().Be((int)HttpStatusCode.NotFound);
            problemDetails.Title.Should().Be("Not Found");
            problemDetails.Detail.Should().Be(exceptionMessage);
        }

        /// <summary>
        /// Verifies that a ConflictException is mapped to a 409 Conflict.
        /// </summary>
        [Fact]
        public async Task InvokeAsync_ShouldReturnConflict_WhenConflictExceptionIsThrown()
        {
            // Arrange
            var exceptionMessage = "Resource already exists.";
            var middleware = CreateMiddleware(innerHttpContext => throw new ConflictException(exceptionMessage));

            // Act
            await middleware.InvokeAsync(_httpContext);

            // Assert
            _httpContext.Response.StatusCode.Should().Be((int)HttpStatusCode.Conflict);

            var problemDetails = await GetResponseBodyAsProblemDetailsAsync();
            problemDetails.Should().NotBeNull();
            problemDetails!.Status.Should().Be((int)HttpStatusCode.Conflict);
            problemDetails.Title.Should().Be("Conflict");
            problemDetails.Detail.Should().Be(exceptionMessage);
        }

        /// <summary>
        /// Verifies that a FluentValidation.ValidationException is mapped to a 400 Bad Request
        /// and includes the validation errors in the response.
        /// </summary>
        [Fact]
        public async Task InvokeAsync_ShouldReturnValidationProblemDetails_WhenFluentValidationExceptionIsThrown()
        {
            // Arrange
            var failures = new List<FluentValidation.Results.ValidationFailure>
            {
                new("Email", "Email is required"),
                new("Password", "Password is too short")
            };
            var exception = new FluentValidation.ValidationException(failures);
            var middleware = CreateMiddleware(innerHttpContext => throw exception);

            // Act
            await middleware.InvokeAsync(_httpContext);

            // Assert
            _httpContext.Response.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            
            _httpContext.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(_httpContext.Response.Body);
            var responseBody = await reader.ReadToEndAsync();
            
            var problemDetails = JsonSerializer.Deserialize<ValidationProblemDetails>(responseBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            problemDetails.Should().NotBeNull();
            problemDetails!.Errors.Should().ContainKey("Email");
            problemDetails.Errors["Email"].Should().Contain("Email is required");
            problemDetails.Errors.Should().ContainKey("Password");
            problemDetails.Errors["Password"].Should().Contain("Password is too short");
        }
    }

    /// <summary>
    /// Tests for handling generic or unhandled exceptions.
    /// </summary>
    public class GenericExceptionHandler : ExceptionMiddlewareTests
    {
        /// <summary>
        /// Verifies that a generic Exception is mapped to a 500 Internal Server Error, 
        /// and that sensitive error details are hidden from the client.
        /// </summary>
        [Fact]
        public async Task InvokeAsync_ShouldReturnInternalServerError_AndHideDetails_WhenGenericExceptionIsThrown()
        {
            // Arrange
            var sensitiveMessage = "Database connection string or SQL query failed: SELECT * FROM Users";
            var middleware = CreateMiddleware(innerHttpContext => throw new Exception(sensitiveMessage));

            // Act
            await middleware.InvokeAsync(_httpContext);

            // Assert
            _httpContext.Response.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);

            var problemDetails = await GetResponseBodyAsProblemDetailsAsync();
            problemDetails.Should().NotBeNull();
            problemDetails!.Status.Should().Be((int)HttpStatusCode.InternalServerError);
            problemDetails.Title.Should().Be("Internal Server Error");

            // Critical check: the sensitive message should NOT be exposed in the Detail property
            problemDetails.Detail.Should().Be("An unexpected error occurred while processing your request.");
            problemDetails.Detail.Should().NotBe(sensitiveMessage);
        }

        /// <summary>
        /// Verifies that the Logger is properly invoked with the Exception details when any error occurs.
        /// </summary>
        [Fact]
        public async Task InvokeAsync_ShouldLogError_WhenExceptionIsThrown()
        {
            // Arrange
            var exception = new Exception("Test exception for logging");
            var middleware = CreateMiddleware(innerHttpContext => throw exception);

            // Act
            await middleware.InvokeAsync(_httpContext);

            // Assert
            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("An unhandled exception has occurred: Test exception for logging")),
                    exception,
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }
    }
}
