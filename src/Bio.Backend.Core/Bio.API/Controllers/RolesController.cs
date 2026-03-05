using Microsoft.AspNetCore.Mvc;
using Bio.Application.DTOs;
using Bio.Application.Services;

namespace Bio.API.Controllers;

/// <summary>
/// Controller for managing security roles.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
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
            var response = await _roleService.CreateRoleAsync(dto);
            // We don't have GetRoleById yet but we can use the location header if needed.
            // For now, just returning CreatedAtAction (assuming we might adding GetById later)
            // or just status 201 with the object.
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
        var roles = await _roleService.GetAllRolesAsync();
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
        var role = await _roleService.GetRoleByIdAsync(id);
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
    /// <response code="44">If the role is not found.</response>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(RoleResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleResponseDTO>> UpdateRole(Guid id, RoleUpdateDTO dto)
    {
        try
        {
            var response = await _roleService.UpdateRoleAsync(id, dto);
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
    /// Retrieves a security role by its unique name.
    /// </summary>
    /// <param name="name">The name of the role.</param>
    /// <returns>The role information or 404 if not found.</returns>
    [HttpGet("name/{name}")]
    [ProducesResponseType(typeof(RoleResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleResponseDTO>> GetRoleByName(string name)
    {
        var role = await _roleService.GetRoleByNameAsync(name);
        if (role == null) return NotFound();
        return Ok(role);
    }
}
