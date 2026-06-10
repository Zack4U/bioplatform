using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentValidation;
using MediatR;

namespace Bio.Application.Features.Community.Reactions.Commands;

// =============================================================================
// TOGGLE REACTION (upsert with counter update on post/comment)
// Behavior:
//   - No previous reaction: Add new reaction, increment counter
//   - Same reaction exists: Remove it, decrement counter (toggle off)
//   - Different reaction exists: Change it, update both counters
// =============================================================================

public record ToggleCommunityReactionCommand(
    CommunityReactionToggleDTO Dto,
    Guid ActorId) : IRequest<CommunityReactionResultDTO>;

public class ToggleCommunityReactionCommandHandler
    : IRequestHandler<ToggleCommunityReactionCommand, CommunityReactionResultDTO>
{
    private readonly ICommunityReactionRepository _reactionRepo;
    private readonly ICommunityPostRepository _postRepo;
    private readonly ICommunityPostCommentRepository _commentRepo;
    private readonly IUnitOfWork _uow;

    public ToggleCommunityReactionCommandHandler(
        ICommunityReactionRepository reactionRepo,
        ICommunityPostRepository postRepo,
        ICommunityPostCommentRepository commentRepo,
        IUnitOfWork uow)
    {
        _reactionRepo = reactionRepo;
        _postRepo = postRepo;
        _commentRepo = commentRepo;
        _uow = uow;
    }

    public async Task<CommunityReactionResultDTO> Handle(
        ToggleCommunityReactionCommand request, CancellationToken ct)
    {
        var targetType = request.Dto.TargetType;
        var targetId = request.Dto.TargetId;
        var reactionType = request.Dto.ReactionType;

        var existing = await _reactionRepo.GetByUserAndTargetAsync(
            request.ActorId, targetType, targetId, ct);

        bool removed = false, changed = false;
        string? currentReactionType = null;
        int likesCount = 0, dislikesCount = 0;

        if (targetType == "Post")
        {
            var post = await _postRepo.GetByIdAsync(targetId, ct)
                ?? throw new NotFoundException(nameof(CommunityPost), targetId);

            if (existing is not null)
            {
                if (existing.ReactionType == reactionType)
                {
                    // Toggle off — remove reaction
                    await _reactionRepo.DeleteAsync(existing, ct);
                    if (reactionType == "Like") post.DecrementLikes();
                    else post.DecrementDislikes();
                    removed = true;
                }
                else
                {
                    // Change reaction type
                    if (existing.ReactionType == "Like") post.DecrementLikes();
                    else post.DecrementDislikes();
                    existing.ChangeReactionType(reactionType);
                    if (reactionType == "Like") post.IncrementLikes();
                    else post.IncrementDislikes();
                    changed = true;
                    currentReactionType = reactionType;
                }
            }
            else
            {
                var reaction = new CommunityReaction(request.ActorId, targetType, targetId, reactionType);
                await _reactionRepo.AddAsync(reaction, ct);
                if (reactionType == "Like") post.IncrementLikes();
                else post.IncrementDislikes();
                currentReactionType = reactionType;
            }

            await _uow.SaveChangesAsync(ct);
            likesCount = post.LikesCount;
            dislikesCount = post.DislikesCount;
        }
        else if (targetType == "Comment")
        {
            var comment = await _commentRepo.GetByIdAsync(targetId, ct)
                ?? throw new NotFoundException(nameof(CommunityPostComment), targetId);

            if (comment.IsDeleted)
                throw new ForbiddenException("Cannot react to a deleted comment.");

            if (existing is not null)
            {
                if (existing.ReactionType == reactionType)
                {
                    await _reactionRepo.DeleteAsync(existing, ct);
                    if (reactionType == "Like") comment.DecrementLikes();
                    else comment.DecrementDislikes();
                    removed = true;
                }
                else
                {
                    if (existing.ReactionType == "Like") comment.DecrementLikes();
                    else comment.DecrementDislikes();
                    existing.ChangeReactionType(reactionType);
                    if (reactionType == "Like") comment.IncrementLikes();
                    else comment.IncrementDislikes();
                    changed = true;
                    currentReactionType = reactionType;
                }
            }
            else
            {
                var reaction = new CommunityReaction(request.ActorId, targetType, targetId, reactionType);
                await _reactionRepo.AddAsync(reaction, ct);
                if (reactionType == "Like") comment.IncrementLikes();
                else comment.IncrementDislikes();
                currentReactionType = reactionType;
            }

            await _uow.SaveChangesAsync(ct);
            likesCount = comment.LikesCount;
            dislikesCount = comment.DislikesCount;
        }
        else
        {
            throw new Bio.Domain.Exceptions.ValidationException($"Invalid TargetType '{targetType}'. Must be 'Post' or 'Comment'.");
        }

        return new CommunityReactionResultDTO(removed, changed, currentReactionType, likesCount, dislikesCount);
    }
}

public class ToggleCommunityReactionCommandValidator : AbstractValidator<ToggleCommunityReactionCommand>
{
    private static readonly string[] ValidTargetTypes = ["Post", "Comment"];
    private static readonly string[] ValidReactionTypes = ["Like", "Dislike"];

    public ToggleCommunityReactionCommandValidator()
    {
        RuleFor(x => x.Dto.TargetType)
            .Must(t => ValidTargetTypes.Contains(t))
            .WithMessage("TargetType must be 'Post' or 'Comment'.");

        RuleFor(x => x.Dto.ReactionType)
            .Must(r => ValidReactionTypes.Contains(r))
            .WithMessage("ReactionType must be 'Like' or 'Dislike'.");

        RuleFor(x => x.Dto.TargetId)
            .NotEmpty().WithMessage("TargetId is required.");
    }
}
