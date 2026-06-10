using Bio.Application.DTOs;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentValidation;
using MediatR;

namespace Bio.Application.Features.Community.Posts.Commands;

// =============================================================================
// INTERNAL MAPPER
// =============================================================================

internal static class CommunityPostMapper
{
    internal static CommunityPostListItemDTO ToListItem(CommunityPost p, int commentCount) => new(
        p.Id, p.AuthorUserId,
        p.AuthorUser?.FullName ?? string.Empty,
        p.Title, p.Content, p.Category, p.Status,
        p.IsPinned, p.LikesCount, p.DislikesCount,
        commentCount, p.CreatedAt, p.UpdatedAt);

    internal static CommunityPostDetailDTO ToDetail(CommunityPost p, int commentCount) => new(
        p.Id, p.AuthorUserId,
        p.AuthorUser?.FullName ?? string.Empty,
        p.Title, p.Content, p.Category, p.Status,
        p.IsPinned, p.LikesCount, p.DislikesCount,
        commentCount, p.CreatedAt, p.UpdatedAt);
}

// =============================================================================
// CREATE POST
// =============================================================================

public record CreateCommunityPostCommand(
    CommunityPostCreateDTO Dto,
    Guid ActorId) : IRequest<CommunityPostDetailDTO>;

public class CreateCommunityPostCommandHandler
    : IRequestHandler<CreateCommunityPostCommand, CommunityPostDetailDTO>
{
    private readonly ICommunityPostRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public CreateCommunityPostCommandHandler(ICommunityPostRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<CommunityPostDetailDTO> Handle(
        CreateCommunityPostCommand request, CancellationToken ct)
    {
        var post = new CommunityPost(
            request.ActorId,
            request.Dto.Title,
            request.Dto.Content,
            request.Dto.Category);

        await _repo.AddAsync(post, ct);
        await _uow.SaveChangesAsync(ct);
        // Bust all community:posts cache entries so new post appears immediately
        await _cache.RemoveByPrefixAsync("community:posts", ct);
        return CommunityPostMapper.ToDetail(post, 0);
    }
}

// =============================================================================
// UPDATE POST
// =============================================================================

public record UpdateCommunityPostCommand(
    Guid PostId,
    CommunityPostUpdateDTO Dto,
    Guid ActorId,
    string ActorRole) : IRequest<CommunityPostDetailDTO>;

public class UpdateCommunityPostCommandHandler
    : IRequestHandler<UpdateCommunityPostCommand, CommunityPostDetailDTO>
{
    private readonly ICommunityPostRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public UpdateCommunityPostCommandHandler(ICommunityPostRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<CommunityPostDetailDTO> Handle(
        UpdateCommunityPostCommand request, CancellationToken ct)
    {
        var post = await _repo.GetByIdWithCommentsAsync(request.PostId, ct)
            ?? throw new NotFoundException(nameof(CommunityPost), request.PostId);

        if (post.AuthorUserId != request.ActorId && request.ActorRole != RoleNames.Admin)
            throw new ForbiddenException("You can only edit your own posts.");

        // Only admin can change status to Hidden/Archived
        var newStatus = request.Dto.Status;
        if (newStatus is "Hidden" or "Archived" && request.ActorRole != RoleNames.Admin)
            throw new ForbiddenException("Only admins can archive or hide posts.");

        post.Update(request.Dto.Title, request.Dto.Content, request.Dto.Category, newStatus);
        await _uow.SaveChangesAsync(ct);
        // Bust all list cache entries so updated post appears immediately
        await _cache.RemoveByPrefixAsync("community:posts", ct);
        return CommunityPostMapper.ToDetail(post, post.Comments.Count(c => !c.IsDeleted));
    }
}

// =============================================================================
// DELETE POST
// =============================================================================

public record DeleteCommunityPostCommand(
    Guid PostId,
    Guid ActorId,
    string ActorRole) : IRequest<Unit>;

public class DeleteCommunityPostCommandHandler
    : IRequestHandler<DeleteCommunityPostCommand, Unit>
{
    private readonly ICommunityPostRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public DeleteCommunityPostCommandHandler(ICommunityPostRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<Unit> Handle(DeleteCommunityPostCommand request, CancellationToken ct)
    {
        var post = await _repo.GetByIdAsync(request.PostId, ct)
            ?? throw new NotFoundException(nameof(CommunityPost), request.PostId);

        if (post.AuthorUserId != request.ActorId && request.ActorRole != RoleNames.Admin)
            throw new ForbiddenException("You can only delete your own posts.");

        await _repo.DeleteAsync(post, ct);
        await _uow.SaveChangesAsync(ct);
        // Bust all list cache entries
        await _cache.RemoveByPrefixAsync("community:posts", ct);
        return Unit.Value;
    }
}

// =============================================================================
// PIN / UNPIN POST (Admin only)
// =============================================================================

public record PinCommunityPostCommand(Guid PostId, bool Pin) : IRequest<CommunityPostDetailDTO>;

public class PinCommunityPostCommandHandler
    : IRequestHandler<PinCommunityPostCommand, CommunityPostDetailDTO>
{
    private readonly ICommunityPostRepository _repo;
    private readonly IUnitOfWork _uow;

    public PinCommunityPostCommandHandler(ICommunityPostRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<CommunityPostDetailDTO> Handle(
        PinCommunityPostCommand request, CancellationToken ct)
    {
        var post = await _repo.GetByIdWithCommentsAsync(request.PostId, ct)
            ?? throw new NotFoundException(nameof(CommunityPost), request.PostId);

        if (request.Pin) post.Pin(); else post.Unpin();
        await _uow.SaveChangesAsync(ct);
        return CommunityPostMapper.ToDetail(post, post.Comments.Count(c => !c.IsDeleted));
    }
}

// =============================================================================
// ARCHIVE / UNARCHIVE POST (author self-service, or Admin/Community moderator)
// =============================================================================

public record ArchiveCommunityPostCommand(
    Guid PostId, bool Archive, Guid ActorId, string ActorRole) : IRequest<CommunityPostDetailDTO>;

public class ArchiveCommunityPostCommandHandler
    : IRequestHandler<ArchiveCommunityPostCommand, CommunityPostDetailDTO>
{
    private readonly ICommunityPostRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public ArchiveCommunityPostCommandHandler(ICommunityPostRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<CommunityPostDetailDTO> Handle(
        ArchiveCommunityPostCommand request, CancellationToken ct)
    {
        var post = await _repo.GetByIdWithCommentsAsync(request.PostId, ct)
            ?? throw new NotFoundException(nameof(CommunityPost), request.PostId);

        var isModerator = request.ActorRole == RoleNames.Admin || request.ActorRole == RoleNames.Community;
        if (post.AuthorUserId != request.ActorId && !isModerator)
            throw new ForbiddenException("You can only archive your own posts.");

        if (request.Archive) post.Archive(); else post.Unarchive();
        await _uow.SaveChangesAsync(ct);
        await _cache.RemoveByPrefixAsync("community:posts", ct);
        return CommunityPostMapper.ToDetail(post, post.Comments.Count(c => !c.IsDeleted));
    }
}

// =============================================================================
// HIDE / UNHIDE POST (Admin/Community moderator only — content moderation)
// =============================================================================

public record HideCommunityPostCommand(
    Guid PostId, bool Hide, Guid ActorId, string ActorRole) : IRequest<CommunityPostDetailDTO>;

public class HideCommunityPostCommandHandler
    : IRequestHandler<HideCommunityPostCommand, CommunityPostDetailDTO>
{
    private readonly ICommunityPostRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public HideCommunityPostCommandHandler(ICommunityPostRepository repo, IUnitOfWork uow, ICacheService cache)
    { _repo = repo; _uow = uow; _cache = cache; }

    public async Task<CommunityPostDetailDTO> Handle(
        HideCommunityPostCommand request, CancellationToken ct)
    {
        if (request.ActorRole != RoleNames.Admin && request.ActorRole != RoleNames.Community)
            throw new ForbiddenException("Only administrators and community moderators can hide posts.");

        var post = await _repo.GetByIdWithCommentsAsync(request.PostId, ct)
            ?? throw new NotFoundException(nameof(CommunityPost), request.PostId);

        if (request.Hide) post.Hide(); else post.Unhide();
        await _uow.SaveChangesAsync(ct);
        await _cache.RemoveByPrefixAsync("community:posts", ct);
        return CommunityPostMapper.ToDetail(post, post.Comments.Count(c => !c.IsDeleted));
    }
}
