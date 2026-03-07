using Microsoft.AspNetCore.Mvc;
using Bio.Application.DTOs;
using Bio.Application.Features.Users.Commands.CreateUser;
using Bio.Application.Features.Users.Commands.DeleteUser;
using Bio.Application.Features.Users.Commands.UpdateUser;
using Bio.Application.Features.Users.Queries.GetAllUsers;
using Bio.Application.Features.Users.Queries.GetUserByEmail;
using Bio.Application.Features.Users.Queries.GetUserById;
using Bio.Application.Features.Users.Queries.GetUserByPhoneNumber;
using MediatR;

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
    public async Task<IActionResult> CreateUser(UserCreateDTO userCreateDTO) =>
        await HandleExceptionsAsync(async () => {
            var response = await _mediator.Send(new CreateUserCommand(userCreateDTO));
            return CreatedAtAction(nameof(GetUserById), new { id = response.Id }, response);
        });

    /// <summary>
    /// Retrieves all registered users.
    /// </summary>
    /// <returns>A list of user DTOs.</returns>
    /// <response code="200">Returns the list of users.</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserResponseDTO>), StatusCodes.Status200OK)]
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
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _mediator.Send(new GetUserByIdQuery(id));
        if (user == null) return NotFound();
        return Ok(user);
    }

    /// <summary>
    /// Retrieves a user by their email address.
    /// </summary>
    /// <param name="email">The email to search for.</param>
    /// <returns>The user DTO if found; otherwise, 404.</returns>
    /// <response code="200">User found.</response>
    /// <response code="404">User not found.</response>
    [HttpGet("email/{email}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserByEmail(string email)
    {
        var user = await _mediator.Send(new GetUserByEmailQuery(email));
        if (user == null) return NotFound();
        return Ok(user);
    }

    /// <summary>
    /// Retrieves a user by their phone number.
    /// </summary>
    /// <param name="phoneNumber">The phone number to search for.</param>
    /// <returns>The user DTO if found; otherwise, 404.</returns>
    /// <response code="200">User found.</response>
    /// <response code="404">User not found.</response>
    [HttpGet("phone/{phoneNumber}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserByPhoneNumber(string phoneNumber)
    {
        var user = await _mediator.Send(new GetUserByPhoneNumberQuery(phoneNumber));
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
    /// <response code="400">If the data is invalid.</response>
    /// <response code="404">If the user was not found.</response>
    /// <response code="409">If email or phone is already in use by another user.</response>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(UserResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateUser(Guid id, UserUpdateDTO userUpdateDTO) =>
        await HandleExceptionsAsync(async () => {
            var user = await _mediator.Send(new UpdateUserCommand(id, userUpdateDTO));
            if (user == null) return NotFound();
            return Ok(user);
        });

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
    public async Task<IActionResult> DeleteUser(Guid id) =>
        await HandleExceptionsAsync(async () => {
            var deleted = await _mediator.Send(new DeleteUserCommand(id));
            if (!deleted) return NotFound();
            return NoContent();
        });

    private async Task<IActionResult> HandleExceptionsAsync(Func<Task<IActionResult>> action)
    {
        try
        {
            return await action();
        }
        catch (Bio.Domain.Exceptions.ConflictException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Bio.Domain.Exceptions.ValidationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
