using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for change password requests.
/// </summary>
public record ChangePasswordRequestDTO
{
    public ChangePasswordRequestDTO() { }

    public ChangePasswordRequestDTO(string currentPassword, string newPassword, string confirmNewPassword)
    {
        CurrentPassword = currentPassword;
        NewPassword = newPassword;
        ConfirmNewPassword = confirmNewPassword;
    }

    [Required(ErrorMessage = "Current password is required.")]
    public string CurrentPassword { get; init; } = "";

    [Required(ErrorMessage = "New password is required.")]
    [MinLength(8, ErrorMessage = "New password must be at least 8 characters long.")]
    public string NewPassword { get; init; } = "";

    [Required(ErrorMessage = "Password confirmation is required.")]
    [Compare(nameof(NewPassword), ErrorMessage = "Passwords do not match.")]
    public string ConfirmNewPassword { get; init; } = "";
}
