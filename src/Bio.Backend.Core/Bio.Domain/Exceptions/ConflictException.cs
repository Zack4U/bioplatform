namespace Bio.Domain.Exceptions;

/// <summary>
/// Exception thrown when a business rule conflict occurs (e.g., duplicate unique field).
/// Maps to 409 Conflict in the API.
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
