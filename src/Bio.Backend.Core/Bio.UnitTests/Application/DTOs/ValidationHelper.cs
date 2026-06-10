using System.ComponentModel.DataAnnotations;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Helper class to simulate ASP.NET Core Data Annotation validation in unit tests.
/// </summary>
public static class ValidationHelper
{
    /// <summary>
    /// Validates an object against its Data Annotation attributes.
    /// </summary>
    /// <param name="model">The object to validate.</param>
    /// <returns>A list of validation results containing any errors found.</returns>
    public static IList<ValidationResult> Validate(object model)
    {
        var results = new List<ValidationResult>();
        var context = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, context, results, true);
        return results;
    }
}
