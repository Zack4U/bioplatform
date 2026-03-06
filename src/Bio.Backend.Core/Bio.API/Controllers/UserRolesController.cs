using Microsoft.AspNetCore.Mvc;
using Bio.Application.DTOs;
using Bio.Application.Services;

namespace Bio.API.Controllers;

/// <summary>
/// Dedicated controller for independent user-role management.
/// </summary>
[ApiController]
[Route("api/user-roles")]
[Produces("application/json")]
public class UserRolesController : ControllerBase
{
    private readonly IUserRoleService _userRoleService;

    public UserRolesController(IUserRoleService userRoleService)
    {
        _userRoleService = userRoleService;
    }

    /// <summary>
    /// Retrieves all user-role assignments with full details (names).
    /// </summary>
    /// <returns>A list of assignments.</returns>
    /// <response code="200">List of assignments retrieved.</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserRoleReadDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAssignments()
    {
        var assignments = await _userRoleService.GetAllAssignmentsAsync();
        return Ok(assignments);
    }

    /// <summary>
    /// Retrieves all roles assigned to a specific user.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <returns>A list of roles assigned to that user.</returns>
    [HttpGet("user/{userId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<UserRoleReadDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByUser(Guid userId)
    {
        var assignments = await _userRoleService.GetAssignmentsByUserIdAsync(userId);
        return Ok(assignments);
    }

    /// <summary>
    /// Retrieves all users assigned to a specific role name.
    /// </summary>
    /// <param name="roleName">The name of the role.</param>
    /// <returns>A list of user-role assignments for that role.</returns>
    [HttpGet("role/{roleName}")]
    [ProducesResponseType(typeof(IEnumerable<UserRoleReadDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByRole(string roleName)
    {
        var assignments = await _userRoleService.GetAssignmentsByRoleNameAsync(roleName);
        return Ok(assignments);
    }

    /// <summary>
    /// Retrieves all users assigned to a specific role ID.
    /// </summary>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <returns>A list of user-role assignments for that role ID.</returns>
    [HttpGet("role-id/{roleId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<UserRoleReadDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByRoleId(Guid roleId)
    {
        var assignments = await _userRoleService.GetAssignmentsByRoleIdAsync(roleId);
        return Ok(assignments);
    }

    /// <summary>
    /// Assigns a security role to a user.
    /// </summary>
    /// <param name="dto">The assignment data containing UserId and RoleId.</param>
    /// <returns>204 No Content if successfully assigned.</returns>
    /// <response code="204">Role successfully assigned.</response>
    /// <response code="400">If the role is already assigned or validation fails.</response>
    /// <response code="404">If the user or role was not found.</response>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRole([FromBody] UserRoleCreateDTO dto)
    {
        try
        {
            await _userRoleService.AssignRoleAsync(dto);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
