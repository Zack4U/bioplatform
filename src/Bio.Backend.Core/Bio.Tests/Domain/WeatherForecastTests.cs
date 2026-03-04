namespace Bio.Tests.Domain;

/// <summary>
/// Unit tests for the WeatherForecast model.
/// Validates the TemperatureF computed property (Celsius-to-Fahrenheit).
/// </summary>
public class WeatherForecastTests
{
    [Theory]
    [InlineData(0, 32)]
    [InlineData(100, 211)]
    [InlineData(-40, -39)]
    [InlineData(25, 76)]
    [InlineData(-20, -3)]
    public void TemperatureF_ShouldConvertFromCelsiusCorrectly(
        int celsius,
        int expectedFahrenheit)
    {
        // Arrange
        var forecast = new Bio.API.WeatherForecast
        {
            TemperatureC = celsius
        };

        // Act
        var result = forecast.TemperatureF;

        // Assert
        Assert.Equal(expectedFahrenheit, result);
    }

    [Fact]
    public void Date_ShouldBeSettable()
    {
        // Arrange
        var date = new DateOnly(2026, 3, 4);

        // Act
        var forecast = new Bio.API.WeatherForecast { Date = date };

        // Assert
        Assert.Equal(date, forecast.Date);
    }

    [Fact]
    public void Summary_ShouldBeNullByDefault()
    {
        // Arrange & Act
        var forecast = new Bio.API.WeatherForecast();

        // Assert
        Assert.Null(forecast.Summary);
    }
}
