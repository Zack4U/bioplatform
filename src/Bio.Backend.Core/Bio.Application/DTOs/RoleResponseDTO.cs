namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for role responses.
/// </summary>
/// <param name="Id">Unique identifier for the role.</param>
/// <param name="Name">Name of the role.</param>
/// <param name="Description">Description of the role.</param>
/// <param name="CreatedAt">Timestamp of when the role was created.</param>
/// <param name="UpdatedAt">Timestamp of when the role was last updated.</param>
public record RoleResponseDTO(
    Guid Id,
    string Name = "",
    string? Description = null,
    DateTime CreatedAt = default,
    DateTime? UpdatedAt = null
);
