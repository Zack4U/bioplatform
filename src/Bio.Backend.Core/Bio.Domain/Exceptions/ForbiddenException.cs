namespace Bio.Domain.Exceptions;

/// <summary>
/// Exception thrown when a user is authenticated but does not have permission for the action.
/// Maps to 403 Forbidden in the API.
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message)
    {
        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Exception message cannot be empty.", nameof(message));
    }
}
