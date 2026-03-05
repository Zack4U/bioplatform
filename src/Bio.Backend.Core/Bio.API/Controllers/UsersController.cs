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
        return CreatedAtAction(nameof(GetUserById), new { id = response.Id }, response);
    }

    /// <summary>
    /// Retrieves all registered users.
    /// </summary>
    /// <returns>A list of user DTOs.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserResponseDTO>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserResponseDTO>>> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    /// <summary>
    /// Retrieves a user by their unique identifier.
    /// </summary>
    /// <param name="id">The user's unique ID.</param>
    /// <returns>The user DTO if found; otherwise, 404.</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponseDTO>> GetUserById(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    /// <summary>
    /// Retrieves a user by their email address.
    /// </summary>
    /// <param name="email">The email to search for.</param>
    /// <returns>The user DTO if found; otherwise, 404.</returns>
    [HttpGet("email/{email}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponseDTO>> GetUserByEmail(string email)
    {
        var user = await _userService.GetUserByEmailAsync(email);
        if (user == null) return NotFound();
        return Ok(user);
    }

    /// <summary>
    /// Retrieves a user by their phone number.
    /// </summary>
    /// <param name="phoneNumber">The phone number to search for.</param>
    /// <returns>The user DTO if found; otherwise, 404.</returns>
    [HttpGet("phone/{phoneNumber}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponseDTO>> GetUserByPhoneNumber(string phoneNumber)
    {
        var user = await _userService.GetUserByPhoneNumberAsync(phoneNumber);
        if (user == null) return NotFound();
        return Ok(user);
    }

    /// <summary>
    /// Updates an existing user's FullName, Email, and PhoneNumber.
    /// </summary>
    /// <param name="id">The unique ID of the user to update.</param>
    /// <param name="userUpdateDTO">New profile data.</param>
    /// <returns>The updated user DTO if found; otherwise, 404.</returns>
    /// <response code="200">Returns the updated user.</response>
    /// <response code="400">If the data is invalid or email/phone is already in use by another user.</response>
    /// <response code="404">If the user was not found.</response>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponseDTO>> UpdateUser(Guid id, UserUpdateDTO userUpdateDTO)
    {
        var user = await _userService.UpdateUserAsync(id, userUpdateDTO);
        if (user == null) return NotFound();
        return Ok(user);
    }

    /// <summary>
    /// Deletes a user by their unique identifier.
    /// </summary>
    /// <param name="id">The unique ID of the user to delete.</param>
    /// <returns>204 No Content if deleted; 404 if not found.</returns>
    /// <response code="204">User successfully deleted.</response>
    /// <response code="404">If the user was not found.</response>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var deleted = await _userService.DeleteUserAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
