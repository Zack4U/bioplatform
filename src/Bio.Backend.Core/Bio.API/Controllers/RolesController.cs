using Microsoft.AspNetCore.Mvc;
using Bio.Application.DTOs;
using Bio.Application.Features.Roles.Commands.CreateRole;
using Bio.Application.Features.Roles.Commands.DeleteRole;
using Bio.Application.Features.Roles.Commands.UpdateRole;
using Bio.Application.Features.Roles.Queries.GetAllRoles;
using Bio.Application.Features.Roles.Queries.GetRoleById;
using Bio.Application.Features.Roles.Queries.GetRoleByName;
using MediatR;

namespace Bio.API.Controllers;

/// <summary>
/// Controller for managing security roles using MediatR.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class RolesController : ControllerBase
{
    private readonly IMediator _mediator;

    public RolesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Creates a new security role.
    /// </summary>
    /// <param name="dto">Role creation data.</param>
    /// <returns>The newly created role.</returns>
    /// <response code="201">Returns the newly created role.</response>
    /// <response code="400">If the data is invalid or the role name already exists.</response>
    [HttpPost]
    [ProducesResponseType(typeof(RoleResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RoleResponseDTO>> CreateRole(RoleCreateDTO dto)
    {
        try
        {
            var command = new CreateRoleCommand(dto);
            var response = await _mediator.Send(command);
            return StatusCode(StatusCodes.Status201Created, response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves all security roles.
    /// </summary>
    /// <returns>A list of roles.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<RoleResponseDTO>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RoleResponseDTO>>> GetAllRoles()
    {
        var query = new GetAllRolesQuery();
        var roles = await _mediator.Send(query);
        return Ok(roles);
    }

    /// <summary>
    /// Retrieves a security role by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the role.</param>
    /// <returns>The role information or 404 if not found.</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(RoleResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleResponseDTO>> GetRoleById(Guid id)
    {
        var query = new GetRoleByIdQuery(id);
        var role = await _mediator.Send(query);
        if (role == null) return NotFound();
        return Ok(role);
    }

    /// <summary>
    /// Updates an existing security role.
    /// </summary>
    /// <param name="id">The unique identifier of the role to update.</param>
    /// <param name="dto">The update data.</param>
    /// <returns>The updated role information.</returns>
    /// <response code="200">Returns the updated role.</response>
    /// <response code="400">If the data is invalid or the name is already taken.</response>
    /// <response code="404">If the role is not found.</response>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(RoleResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleResponseDTO>> UpdateRole(Guid id, RoleUpdateDTO dto)
    {
        try
        {
            var command = new UpdateRoleCommand(id, dto);
            var response = await _mediator.Send(command);
            return Ok(response);
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

    /// <summary>
    /// Deletes an existing security role.
    /// </summary>
    /// <param name="id">The unique identifier of the role to delete.</param>
    /// <returns>No content if successful or 404 if not found.</returns>
    /// <response code="204">If the role was successfully deleted.</response>
    /// <response code="404">If the role is not found.</response>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRole(Guid id)
    {
        try
        {
            var command = new DeleteRoleCommand(id);
            await _mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves a security role by its unique name.
    /// </summary>
    /// <param name="name">The name of the role.</param>
    /// <returns>The role information or 404 if not found.</returns>
    [HttpGet("name/{name}")]
    [ProducesResponseType(typeof(RoleResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleResponseDTO>> GetRoleByName(string name)
    {
        var query = new GetRoleByNameQuery(name);
        var role = await _mediator.Send(query);
        if (role == null) return NotFound();
        return Ok(role);
    }
}
