using Bio.API;
using Bio.API.Controllers;
using Microsoft.Extensions.Logging;
using Moq;

namespace Bio.Tests.Controllers;

/// <summary>
/// Unit tests for WeatherForecastController.
/// Validates the Get endpoint returns correct data shape and constraints.
/// </summary>
public class WeatherForecastControllerTests
{
    private readonly WeatherForecastController _controller;

    public WeatherForecastControllerTests()
    {
        var mockLogger = new Mock<ILogger<WeatherForecastController>>();
        _controller = new WeatherForecastController(mockLogger.Object);
    }

    [Fact]
    public void Get_ShouldReturnExactlyFiveForecasts()
    {
        // Act
        var result = _controller.Get().ToList();

        // Assert
        Assert.Equal(5, result.Count);
    }

    [Fact]
    public void Get_ShouldReturnForecastsWithFutureDates()
    {
        // Act
        var result = _controller.Get().ToList();

        // Assert
        var today = DateOnly.FromDateTime(DateTime.Now);
        Assert.All(result, forecast =>
            Assert.True(forecast.Date > today));
    }

    [Fact]
    public void Get_ShouldReturnForecastsWithSequentialDates()
    {
        // Act
        var result = _controller.Get().ToList();

        // Assert
        var today = DateOnly.FromDateTime(DateTime.Now);
        for (var i = 0; i < result.Count; i++)
        {
            Assert.Equal(today.AddDays(i + 1), result[i].Date);
        }
    }

    [Fact]
    public void Get_ShouldReturnTemperaturesWithinRange()
    {
        // Act
        var result = _controller.Get().ToList();

        // Assert — Random.Shared.Next(-20, 55) produces [-20, 54]
        Assert.All(result, forecast =>
        {
            Assert.InRange(forecast.TemperatureC, -20, 54);
        });
    }

    [Fact]
    public void Get_ShouldReturnNonNullSummaries()
    {
        // Act
        var result = _controller.Get().ToList();

        // Assert
        Assert.All(result, forecast =>
            Assert.NotNull(forecast.Summary));
    }

    [Fact]
    public void Get_ShouldReturnValidSummaryValues()
    {
        // Arrange
        var validSummaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild",
            "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        // Act
        var result = _controller.Get().ToList();

        // Assert
        Assert.All(result, forecast =>
            Assert.Contains(forecast.Summary, validSummaries));
    }

    [Fact]
    public void Get_ShouldReturnCorrectTemperatureF()
    {
        // Act
        var result = _controller.Get().ToList();

        // Assert — TemperatureF = 32 + (int)(TemperatureC / 0.5556)
        Assert.All(result, forecast =>
        {
            var expectedF = 32 + (int)(forecast.TemperatureC / 0.5556);
            Assert.Equal(expectedF, forecast.TemperatureF);
        });
    }
}
