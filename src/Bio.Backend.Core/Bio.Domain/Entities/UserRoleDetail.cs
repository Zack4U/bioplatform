namespace Bio.Domain.Entities;

/// <summary>
/// Domain model representing a user-role assignment with expanded details.
/// </summary>
public class UserRoleDetail
{
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
}
