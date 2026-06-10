using Bio.Application.DTOs;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentValidation;
using MediatR;

namespace Bio.Application.Features.Community.Comments.Commands;

// =============================================================================
// INTERNAL MAPPER
// =============================================================================

internal static class CommunityCommentMapper
{
    internal static CommunityCommentResponseDTO ToResponse(CommunityPostComment c) => new(
        c.Id, c.PostId, c.AuthorUserId,
        c.AuthorUser?.FullName ?? string.Empty,
        c.IsDeleted ? "[deleted]" : c.Content,
        c.IsDeleted, c.LikesCount, c.DislikesCount,
        c.CreatedAt, c.UpdatedAt);
}

// =============================================================================
// CREATE COMMENT
// =============================================================================

public record CreateCommunityCommentCommand(
    Guid PostId,
    CommunityCommentCreateDTO Dto,
    Guid ActorId) : IRequest<CommunityCommentResponseDTO>;

public class CreateCommunityCommentCommandHandler
    : IRequestHandler<CreateCommunityCommentCommand, CommunityCommentResponseDTO>
{
    private readonly ICommunityPostCommentRepository _commentRepo;
    private readonly ICommunityPostRepository _postRepo;
    private readonly IUnitOfWork _uow;

    public CreateCommunityCommentCommandHandler(
        ICommunityPostCommentRepository commentRepo,
        ICommunityPostRepository postRepo,
        IUnitOfWork uow)
    { _commentRepo = commentRepo; _postRepo = postRepo; _uow = uow; }

    public async Task<CommunityCommentResponseDTO> Handle(
        CreateCommunityCommentCommand request, CancellationToken ct)
    {
        var post = await _postRepo.GetByIdAsync(request.PostId, ct)
            ?? throw new NotFoundException(nameof(CommunityPost), request.PostId);

        if (post.Status == "Archived" || post.Status == "Hidden")
            throw new ForbiddenException("Cannot comment on archived or hidden posts.");

        var comment = new CommunityPostComment(request.PostId, request.ActorId, request.Dto.Content);
        await _commentRepo.AddAsync(comment, ct);
        await _uow.SaveChangesAsync(ct);
        return CommunityCommentMapper.ToResponse(comment);
    }
}

// =============================================================================
// UPDATE COMMENT
// =============================================================================

public record UpdateCommunityCommentCommand(
    Guid CommentId,
    CommunityCommentUpdateDTO Dto,
    Guid ActorId,
    string ActorRole) : IRequest<CommunityCommentResponseDTO>;

public class UpdateCommunityCommentCommandHandler
    : IRequestHandler<UpdateCommunityCommentCommand, CommunityCommentResponseDTO>
{
    private readonly ICommunityPostCommentRepository _repo;
    private readonly IUnitOfWork _uow;

    public UpdateCommunityCommentCommandHandler(
        ICommunityPostCommentRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<CommunityCommentResponseDTO> Handle(
        UpdateCommunityCommentCommand request, CancellationToken ct)
    {
        var comment = await _repo.GetByIdAsync(request.CommentId, ct)
            ?? throw new NotFoundException(nameof(CommunityPostComment), request.CommentId);

        if (comment.AuthorUserId != request.ActorId && request.ActorRole != RoleNames.Admin)
            throw new ForbiddenException("You can only edit your own comments.");

        if (comment.IsDeleted)
            throw new ForbiddenException("Cannot edit a deleted comment.");

        comment.Update(request.Dto.Content);
        await _uow.SaveChangesAsync(ct);
        return CommunityCommentMapper.ToResponse(comment);
    }
}

// =============================================================================
// DELETE COMMENT (Soft delete)
// =============================================================================

public record DeleteCommunityCommentCommand(
    Guid CommentId,
    Guid ActorId,
    string ActorRole) : IRequest<Unit>;

public class DeleteCommunityCommentCommandHandler
    : IRequestHandler<DeleteCommunityCommentCommand, Unit>
{
    private readonly ICommunityPostCommentRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteCommunityCommentCommandHandler(
        ICommunityPostCommentRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(DeleteCommunityCommentCommand request, CancellationToken ct)
    {
        var comment = await _repo.GetByIdAsync(request.CommentId, ct)
            ?? throw new NotFoundException(nameof(CommunityPostComment), request.CommentId);

        // Community moderators may only REPORT comments, not delete them.
        // Deletion is limited to the author, Admin, or the Environmental Authority.
        var canDelete = comment.AuthorUserId == request.ActorId
            || request.ActorRole == RoleNames.Admin
            || request.ActorRole == RoleNames.EnvironmentalAuthority;
        if (!canDelete)
            throw new ForbiddenException("You do not have permission to delete this comment.");

        comment.SoftDelete();
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
