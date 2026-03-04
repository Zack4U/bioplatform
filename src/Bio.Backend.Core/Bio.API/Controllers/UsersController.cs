using Microsoft.AspNetCore.Mvc;
using Bio.Application.DTOs;
using Bio.Application.Services;

namespace Bio.API.Controllers;

/// <summary>
/// Controller for managing user-related operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Registers a new user in the system.
    /// </summary>
    /// <param name="userCreateDTO">User registration data.</param>
    /// <returns>The newly created user (without password).</returns>
    /// <response code="201">Returns the newly created user.</response>
    /// <response code="400">If the user data is invalid (e.g., email already exists or validation fails).</response>
    [HttpPost]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserResponseDTO>> CreateUser(UserCreateDTO userCreateDTO)
    {
        var response = await _userService.CreateUserAsync(userCreateDTO);
        return CreatedAtAction(nameof(CreateUser), new { id = response.Id }, response);
    }
}
