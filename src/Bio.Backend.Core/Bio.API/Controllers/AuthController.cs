using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Authentication;
using System.Security.Claims;

namespace Bio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Authenticates a user and returns a pair of tokens (Access and Refresh).
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDTO request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Refreshes an expired access token using a valid refresh token.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequestDTO request)
    {
        var result = await _authService.RefreshTokenAsync(request.RefreshToken, request.AccessToken);
        return Ok(result);
    }

    /// <summary>
    /// Revokes a refresh token, invalidating the session.
    /// </summary>
    [HttpPost("revoke")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Revoke([FromBody] string refreshToken)
    {
        await _authService.RevokeTokenAsync(refreshToken);
        return NoContent();
    }

    /// <summary>
    /// Changes the password of the authenticated user.
    /// </summary>
    [HttpPut("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDTO request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        await _authService.ChangePasswordAsync(userId, request);
        return NoContent();
    }

    /// <summary>
    /// Initiates the Two-Factor Authentication setup for the current user.
    /// </summary>
    [HttpPost("2fa/setup")]
    [Authorize]
    [ProducesResponseType(typeof(TwoFactorSetupResponseDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> Setup2FA()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var result = await _authService.SetupTwoFactorAsync(userId);
        return Ok(result);
    }

    /// <summary>
    /// Verifies the 6-digit code to enable Two-Factor Authentication.
    /// </summary>
    [HttpPost("2fa/verify")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Verify2FA([FromBody] TwoFactorVerifyRequestDTO request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var success = await _authService.VerifyTwoFactorAsync(userId, request);
        return success ? Ok(new { Message = "2FA enabled successfully." }) : BadRequest(new { Message = "Invalid code." });
    }

    /// <summary>
    /// Disables Two-Factor Authentication for the current user.
    /// </summary>
    [HttpPost("2fa/disable")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Disable2FA()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

        await _authService.DisableTwoFactorAsync(userId);
        return NoContent();
    }

    /// <summary>
    /// Completes the two-factor authentication challenge during login.
    /// </summary>
    [HttpPost("2fa/login-confirm")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LoginConfirm([FromBody] TwoFactorLoginRequestDTO request)
    {
        var result = await _authService.LoginTwoFactorAsync(request);
        return Ok(result);
    }
}

