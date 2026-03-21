using Microsoft.AspNetCore.Mvc;
using Bio.Domain.Constants;
using Bio.Application.DTOs;
using Bio.Application.Features.UserRoles.Commands.AssignRole;
using Bio.Application.Features.UserRoles.Commands.UnassignRole;
using Bio.Application.Features.UserRoles.Queries.GetAllUserRoles;
using Bio.Application.Features.UserRoles.Queries.GetUserRolesByRoleId;
using Bio.Application.Features.UserRoles.Queries.GetUserRolesByRoleName;
using Bio.Application.Features.UserRoles.Queries.GetUserRolesByUserId;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace Bio.API.Controllers;

/// <summary>
/// Dedicated controller for independent user-role management using MediatR.
/// </summary>
[Authorize(Roles = RoleNames.Admin)]
[ApiController]
[Route("api/user-roles")]
[Produces("application/json")]
public class UserRolesController : ControllerBase
{
    private readonly IMediator _mediator;

    public UserRolesController(IMediator mediator)
    {
        _mediator = mediator;
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
        var query = new GetAllUserRolesQuery();
        var assignments = await _mediator.Send(query);
        return Ok(assignments);
    }

    /// <summary>
    /// Retrieves all roles assigned to a specific user.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <returns>A list of roles assigned to that user.</returns>
    /// <response code="200">Assignments found.</response>
    /// <response code="404">User not found.</response>
    [HttpGet("user/{userId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<UserRoleResponseDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUser(Guid userId)
    {
        var result = await _mediator.Send(new GetUserRolesByUserIdQuery(userId));
        return Ok(result);
    }

    /// <summary>
    /// Retrieves all users assigned to a specific role name.
    /// </summary>
    /// <param name="roleName">The name of the role.</param>
    /// <returns>A list of user-role assignments for that role.</returns>
    /// <response code="200">Assignments found.</response>
    /// <response code="404">Role not found.</response>
    [HttpGet("role/{roleName}")]
    [ProducesResponseType(typeof(IEnumerable<UserRoleResponseDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByRole(string roleName)
    {
        var result = await _mediator.Send(new GetUserRolesByRoleNameQuery(roleName));
        return Ok(result);
    }

    /// <summary>
    /// Retrieves all users assigned to a specific role ID.
    /// </summary>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <returns>A list of user-role assignments for that role ID.</returns>
    /// <response code="200">Assignments found.</response>
    /// <response code="404">Role not found.</response>
    [HttpGet("role-id/{roleId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<UserRoleResponseDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByRoleId(Guid roleId)
    {
        var result = await _mediator.Send(new GetUserRolesByRoleIdQuery(roleId));
        return Ok(result);
    }

    /// <summary>
    /// Assigns a security role to a user.
    /// </summary>
    /// <param name="dto">The assignment data containing UserId and RoleId.</param>
    /// <returns>204 No Content if successfully assigned.</returns>
    /// <response code="204">Role successfully assigned.</response>
    /// <response code="400">If validation fails.</response>
    /// <response code="404">If the user or role was not found.</response>
    /// <response code="409">If the role is already assigned to the user.</response>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AssignRole([FromBody] UserRoleCreateDTO dto)
    {
        await _mediator.Send(new AssignRoleCommand(dto));
        return NoContent();
    }

    /// <summary>
    /// Unassigns a security role from a user.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <returns>204 No Content if successfully unassigned.</returns>
    /// <response code="204">Role successfully unassigned.</response>
    /// <response code="404">If the assignment was not found.</response>
    [HttpDelete("user/{userId:guid}/role/{roleId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnassignRole(Guid userId, Guid roleId)
    {
        await _mediator.Send(new UnassignRoleCommand(userId, roleId));
        return NoContent();
    }
}
