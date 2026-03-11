using Microsoft.AspNetCore.Mvc;
using Bio.Application.DTOs;
using Bio.Application.Features.Users.Commands.CreateUser;
using Bio.Application.Features.Users.Commands.DeleteUser;
using Bio.Application.Features.Users.Commands.UpdateUser;
using Bio.Application.Features.Users.Queries.GetAllUsers;
using Bio.Application.Features.Users.Queries.GetUserByEmail;
using Bio.Application.Features.Users.Queries.GetUserById;
using Bio.Application.Features.Users.Queries.GetUserByPhoneNumber;
using Bio.Domain.Exceptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// Controller for managing user-related operations using MediatR.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Registers a new user in the system.
    /// </summary>
    /// <param name="userCreateDTO">User registration data.</param>
    /// <returns>The newly created user (without password).</returns>
    /// <response code="201">Returns the newly created user.</response>
    /// <response code="400">If the user data is invalid (validation fails).</response>
    /// <response code="409">If email or phone number is already in use.</response>
    [HttpPost]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateUser(UserCreateDTO userCreateDTO)
    {
        var response = await _mediator.Send(new CreateUserCommand(userCreateDTO));
        return CreatedAtAction(nameof(GetUserById), new { id = response.Id }, response);
    }

    /// <summary>
    /// Retrieves all registered users. Restricted to administrators.
    /// </summary>
    /// <returns>A list of user DTOs.</returns>
    /// <response code="200">Returns the list of users.</response>
    /// <response code="403">If the user is not an administrator.</response>
    /// <response code="401">If the user is not authenticated.</response>
    [Authorize(Roles = "ADMIN")]
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserResponseDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _mediator.Send(new GetAllUsersQuery());
        return Ok(users);
    }

    /// <summary>
    /// Retrieves a user by their unique identifier.
    /// </summary>
    /// <param name="id">The user's unique ID.</param>
    /// <returns>The user DTO if found; otherwise, 404.</returns>
    /// <response code="200">User found.</response>
    /// <response code="404">User not found.</response>
    [Authorize(Roles = "ADMIN")]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _mediator.Send(new GetUserByIdQuery(id));
        return Ok(user);
    }

    /// <summary>
    /// Retrieves a user by their email address.
    /// </summary>
    /// <param name="email">The email to search for.</param>
    /// <returns>The user DTO if found; otherwise, 404.</returns>
    /// <response code="200">User found.</response>
    /// <response code="404">User not found.</response>
    [Authorize(Roles = "ADMIN")]
    [HttpGet("email/{email}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserByEmail(string email)
    {
        var user = await _mediator.Send(new GetUserByEmailQuery(email));
        return Ok(user);
    }

    /// <summary>
    /// Retrieves a user by their phone number.
    /// </summary>
    /// <param name="phoneNumber">The phone number to search for.</param>
    /// <returns>The user DTO if found; otherwise, 404.</returns>
    /// <response code="200">User found.</response>
    /// <response code="404">User not found.</response>
    [Authorize(Roles = "ADMIN")]
    [HttpGet("phone/{phoneNumber}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserByPhoneNumber(string phoneNumber)
    {
        var user = await _mediator.Send(new GetUserByPhoneNumberQuery(phoneNumber));
        return Ok(user);
    }

    /// <summary>
    /// Updates an existing user's FullName, Email, and PhoneNumber.
    /// </summary>
    /// <param name="id">The unique ID of the user to update.</param>
    /// <param name="userUpdateDTO">New profile data.</param>
    /// <returns>The updated user DTO if found; otherwise, 404.</returns>
    /// <response code="200">Returns the updated user.</response>
    /// <response code="400">If the data is invalid.</response>
    /// <response code="404">If the user was not found.</response>
    /// <response code="409">If email or phone is already in use by another user.</response>
    [Authorize]
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateUser(Guid id, UserUpdateDTO userUpdateDTO)
    {
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                                 ?? User.FindFirst("sub")?.Value;

        if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId) || currentUserId != id)
        {
            throw new ForbiddenException("You can only update your own profile.");
        }

        var user = await _mediator.Send(new UpdateUserCommand(id, userUpdateDTO));
        return Ok(user);
    }

    /// <summary>
    /// Deletes a user by their unique identifier.
    /// </summary>
    /// <param name="id">The unique ID of the user to delete.</param>
    /// <returns>204 No Content if deleted; 404 if not found.</returns>
    /// <response code="204">User successfully deleted.</response>
    /// <response code="404">If the user was not found.</response>
    [Authorize]
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var isIdMatch = false;
        var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                                 ?? User.FindFirst("sub")?.Value;

        if (currentUserIdClaim != null && Guid.TryParse(currentUserIdClaim, out var currentUserId))
        {
            isIdMatch = currentUserId == id;
        }

        if (!User.IsInRole("ADMIN") && !isIdMatch)
        {
            throw new ForbiddenException("You can only delete your own account or you must be an administrator.");
        }

        await _mediator.Send(new DeleteUserCommand(id));
        return NoContent();
    }
}
