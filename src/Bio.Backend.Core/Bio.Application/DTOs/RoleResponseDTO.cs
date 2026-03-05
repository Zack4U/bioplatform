namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for role responses.
/// </summary>
public class RoleResponseDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
