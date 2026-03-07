namespace Bio.Domain.Exceptions;

/// <summary>
/// Exception thrown when domain validation fails.
/// Maps to 400 Bad Request in the API.
/// </summary>
public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}
