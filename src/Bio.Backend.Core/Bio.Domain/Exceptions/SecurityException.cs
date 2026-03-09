namespace Bio.Domain.Exceptions;

/// <summary>
/// Exception for security-related errors.
/// </summary>
public class SecurityException : Exception 
{ 
    /// <summary>
    /// Initializes a new instance of the <see cref="SecurityException"/> class.
    /// </summary>
    /// <param name="message">The error message.</param>
    public SecurityException(string message) : base(message) { }
}
