namespace Bio.Domain.Exceptions;

/// <summary>
/// Exception thrown when a requested resource is not found.
/// Maps to 404 Not Found in the API.
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message)
    {
        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Exception message cannot be empty.", nameof(message));
    }

    public NotFoundException(string name, object key)
        : base($"Entity \"{name}\" ({key}) was not found.")
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Entity name cannot be empty.", nameof(name));
    }
}
