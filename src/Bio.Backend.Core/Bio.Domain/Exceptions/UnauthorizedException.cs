namespace Bio.Domain.Exceptions;

/// <summary>
/// Exception thrown when authentication fails.
/// Maps to 401 Unauthorized in the API.
/// </summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message)
    {
        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Exception message cannot be empty.", nameof(message));
    }
}
