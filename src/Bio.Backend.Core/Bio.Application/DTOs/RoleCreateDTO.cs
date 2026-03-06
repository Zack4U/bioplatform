namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for role creation.
/// </summary>
public class RoleCreateDTO
{
    /// <summary>
    /// Name of the role (e.g., ADMIN). Will be normalized to uppercase.
    /// </summary>
    /// <example>ADMIN</example>
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the role.
    /// </summary>
    /// <example>System Administrator</example>
    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
    public string? Description { get; set; }
}
