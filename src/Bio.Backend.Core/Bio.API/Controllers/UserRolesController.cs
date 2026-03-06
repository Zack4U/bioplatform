using Microsoft.AspNetCore.Mvc;
using Bio.Application.DTOs;
using Bio.Application.Services;
using Bio.Application.Interfaces;

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
    [ProducesResponseType(typeof(IEnumerable<UserRoleResponseDTO>), StatusCodes.Status200OK)]
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
    [ProducesResponseType(typeof(IEnumerable<UserRoleResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByUser(Guid userId) =>
        await HandleExceptionsAsync(async () => Ok(await _userRoleService.GetAssignmentsByUserIdAsync(userId)));

    /// <summary>
    /// Retrieves all users assigned to a specific role name.
    /// </summary>
    /// <param name="roleName">The name of the role.</param>
    /// <returns>A list of user-role assignments for that role.</returns>
    [HttpGet("role/{roleName}")]
    [ProducesResponseType(typeof(IEnumerable<UserRoleResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByRole(string roleName) =>
        await HandleExceptionsAsync(async () => Ok(await _userRoleService.GetAssignmentsByRoleNameAsync(roleName)));

    /// <summary>
    /// Retrieves all users assigned to a specific role ID.
    /// </summary>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <returns>A list of user-role assignments for that role ID.</returns>
    [HttpGet("role-id/{roleId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<UserRoleResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByRoleId(Guid roleId) =>
        await HandleExceptionsAsync(async () => Ok(await _userRoleService.GetAssignmentsByRoleIdAsync(roleId)));

    /// <summary>
    /// Assigns a security role to a user.
    /// </summary>
    /// <param name="dto">The assignment data containing UserId and RoleId.</param>
    /// <returns>204 No Content if successfully assigned.</returns>
    /// <response code="204">Role successfully assigned.</response>
    /// <response code="400">If the role is already assigned or validation fails.</response>
    /// <response code="404">If the user or role was not found.</response>
    public async Task<IActionResult> AssignRole([FromBody] UserRoleCreateDTO dto) =>
        await HandleExceptionsAsync(async () => {
            await _userRoleService.AssignRoleAsync(dto);
            return NoContent();
        });

    /// <summary>
    /// Unassigns a security role from a user.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <returns>204 No Content if successfully unassigned.</returns>
    /// <response code="204">Role successfully unassigned.</response>
    /// <response code="404">If the assignment was not found.</response>
    public async Task<IActionResult> UnassignRole(Guid userId, Guid roleId) =>
        await HandleExceptionsAsync(async () => {
            await _userRoleService.UnassignRoleAsync(userId, roleId);
            return NoContent();
        });

    private async Task<IActionResult> HandleExceptionsAsync(Func<Task<IActionResult>> action)
    {
        try
        {
            return await action();
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
