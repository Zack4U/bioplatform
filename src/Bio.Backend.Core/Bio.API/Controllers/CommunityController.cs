using Bio.Application.DTOs;
using Bio.Application.Features.Community.Posts.Commands;
using Bio.Application.Features.Community.Posts.Queries;
using Bio.Application.Features.Community.Comments.Commands;
using Bio.Application.Features.Community.Comments.Queries;
using Bio.Application.Features.Community.Reactions.Commands;
using Bio.Domain.Constants;
using Bio.Domain.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Bio.API.Controllers;

/// <summary>
/// Community forum: posts, comments, and reactions.
/// Public read access. Write access requires authentication.
/// Pin/Unpin restricted to ADMIN. Archive is author or ADMIN/COMMUNITY moderator self-service;
/// Hide (content moderation) restricted to ADMIN/COMMUNITY moderators.
/// </summary>
[ApiController]
[Route("api/v1/community")]
[Produces("application/json")]
public class CommunityController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICacheService _cache;

    public CommunityController(IMediator mediator, ICacheService cache)
    { _mediator = mediator; _cache = cache; }

    private Guid ActorId => Guid.Parse(
        User.FindFirstValue("sub") ?? throw new UnauthorizedAccessException("User identity missing."));
    private string ActorRole => User.FindFirstValue("role") ?? string.Empty;

    // ── POSTS ─────────────────────────────────────────────────────────────────

    /// <summary>Returns a paginated list of published community posts. Public.</summary>
    [HttpGet("posts")]
    [ProducesResponseType(typeof(PaginatedResult<CommunityPostListItemDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPosts(
        [FromQuery] string? category,
        [FromQuery] string? status,
        [FromQuery(Name = "q")] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(new GetCommunityPostsQuery(category, status, page, pageSize, search), ct));

    /// <summary>Returns a single community post with comment count. Public.</summary>
    [HttpGet("posts/{postId:guid}")]
    [ProducesResponseType(typeof(CommunityPostDetailDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPostById(Guid postId, CancellationToken ct = default)
        => Ok(await _mediator.Send(new GetCommunityPostByIdQuery(postId), ct));

    /// <summary>Creates a community post. Any authenticated user.</summary>
    [HttpPost("posts")]
    [Authorize]
    [ProducesResponseType(typeof(CommunityPostDetailDTO), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreatePost([FromBody] CommunityPostCreateDTO dto, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new CreateCommunityPostCommand(dto, ActorId), ct);
        // Invalidate public posts cache
        await _cache.RemoveByPrefixAsync("community:posts:", ct);
        return CreatedAtAction(nameof(GetPostById), new { postId = result.Id }, result);
    }

    /// <summary>Updates a community post. Author or Admin only.</summary>
    [HttpPut("posts/{postId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(CommunityPostDetailDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePost(
        Guid postId, [FromBody] CommunityPostUpdateDTO dto, CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new UpdateCommunityPostCommand(postId, dto, ActorId, ActorRole), ct);
        await _cache.RemoveByPrefixAsync("community:posts:", ct);
        return Ok(result);
    }

    /// <summary>Deletes a community post. Author or Admin only.</summary>
    [HttpDelete("posts/{postId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePost(Guid postId, CancellationToken ct = default)
    {
        await _mediator.Send(new DeleteCommunityPostCommand(postId, ActorId, ActorRole), ct);
        await _cache.RemoveByPrefixAsync("community:posts:", ct);
        return NoContent();
    }

    /// <summary>Pins a community post. Admin, Authority, or Community moderator.</summary>
    [HttpPost("posts/{postId:guid}/pin")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority},{RoleNames.Community}")]
    [ProducesResponseType(typeof(CommunityPostDetailDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> PinPost(Guid postId, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new PinCommunityPostCommand(postId, true), ct);
        await _cache.RemoveByPrefixAsync("community:posts:", ct);
        return Ok(result);
    }

    /// <summary>Unpins a community post. Admin, Authority, or Community moderator.</summary>
    [HttpDelete("posts/{postId:guid}/pin")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority},{RoleNames.Community}")]
    [ProducesResponseType(typeof(CommunityPostDetailDTO), StatusCodes.Status200OK)]
    public async Task<IActionResult> UnpinPost(Guid postId, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new PinCommunityPostCommand(postId, false), ct);
        await _cache.RemoveByPrefixAsync("community:posts:", ct);
        return Ok(result);
    }

    /// <summary>Archives a community post (no longer shown in active feeds). Author or Admin/Community moderator.</summary>
    [HttpPost("posts/{postId:guid}/archive")]
    [Authorize]
    [ProducesResponseType(typeof(CommunityPostDetailDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchivePost(Guid postId, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new ArchiveCommunityPostCommand(postId, true, ActorId, ActorRole), ct);
        await _cache.RemoveByPrefixAsync("community:posts:", ct);
        return Ok(result);
    }

    /// <summary>Restores an archived post to Published. Author or Admin/Community moderator.</summary>
    [HttpDelete("posts/{postId:guid}/archive")]
    [Authorize]
    [ProducesResponseType(typeof(CommunityPostDetailDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnarchivePost(Guid postId, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new ArchiveCommunityPostCommand(postId, false, ActorId, ActorRole), ct);
        await _cache.RemoveByPrefixAsync("community:posts:", ct);
        return Ok(result);
    }

    /// <summary>Hides a post for violating community guidelines. Admin/Community moderator only.</summary>
    [HttpPost("posts/{postId:guid}/hide")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority},{RoleNames.Community}")]
    [ProducesResponseType(typeof(CommunityPostDetailDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> HidePost(Guid postId, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new HideCommunityPostCommand(postId, true, ActorId, ActorRole), ct);
        await _cache.RemoveByPrefixAsync("community:posts:", ct);
        return Ok(result);
    }

    /// <summary>Unhides a post, restoring it to Published. Admin/Community moderator only.</summary>
    [HttpDelete("posts/{postId:guid}/hide")]
    [Authorize(Roles = $"{RoleNames.Admin},{RoleNames.EnvironmentalAuthority},{RoleNames.Community}")]
    [ProducesResponseType(typeof(CommunityPostDetailDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnhidePost(Guid postId, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new HideCommunityPostCommand(postId, false, ActorId, ActorRole), ct);
        await _cache.RemoveByPrefixAsync("community:posts:", ct);
        return Ok(result);
    }

    // ── COMMENTS ──────────────────────────────────────────────────────────────

    /// <summary>Returns paginated comments for a post. Public.</summary>
    [HttpGet("posts/{postId:guid}/comments")]
    [ProducesResponseType(typeof(PaginatedResult<CommunityCommentResponseDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetComments(
        Guid postId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
        => Ok(await _mediator.Send(new GetCommentsByPostQuery(postId, page, pageSize), ct));

    /// <summary>Creates a comment on a post. Any authenticated user.</summary>
    [HttpPost("posts/{postId:guid}/comments")]
    [Authorize]
    [ProducesResponseType(typeof(CommunityCommentResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateComment(
        Guid postId, [FromBody] CommunityCommentCreateDTO dto, CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new CreateCommunityCommentCommand(postId, dto, ActorId), ct);
        return CreatedAtAction(nameof(GetComments), new { postId }, result);
    }

    /// <summary>Updates a comment. Author or Admin only.</summary>
    [HttpPut("posts/{postId:guid}/comments/{commentId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(CommunityCommentResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateComment(
        Guid postId, Guid commentId, [FromBody] CommunityCommentUpdateDTO dto, CancellationToken ct = default)
        => Ok(await _mediator.Send(
            new UpdateCommunityCommentCommand(commentId, dto, ActorId, ActorRole), ct));

    /// <summary>Soft-deletes a comment (content replaced with [deleted]). Author or Admin only.</summary>
    [HttpDelete("posts/{postId:guid}/comments/{commentId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteComment(
        Guid postId, Guid commentId, CancellationToken ct = default)
    {
        await _mediator.Send(
            new DeleteCommunityCommentCommand(commentId, ActorId, ActorRole), ct);
        return NoContent();
    }

    // ── REACTIONS ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Toggles a Like or Dislike reaction on a Post or Comment.
    /// Same reaction → removed. Different reaction → changed. New → added.
    /// Any authenticated user.
    /// </summary>
    [HttpPost("reactions")]
    [Authorize]
    [ProducesResponseType(typeof(CommunityReactionResultDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleReaction(
        [FromBody] CommunityReactionToggleDTO dto, CancellationToken ct = default)
        => Ok(await _mediator.Send(new ToggleCommunityReactionCommand(dto, ActorId), ct));
}
