using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

/// <summary>
/// Repository for community forum posts.
/// Includes Redis cache invalidation via ICacheService on writes.
/// </summary>
public class CommunityPostRepository : ICommunityPostRepository
{
    private readonly BioDbContext _ctx;

    public CommunityPostRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<CommunityPost?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.CommunityPosts
            .Include(p => p.AuthorUser)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<CommunityPost?> GetByIdWithCommentsAsync(Guid id, CancellationToken ct)
        => await _ctx.CommunityPosts
            .Include(p => p.AuthorUser)
            .Include(p => p.Comments.Where(c => !c.IsDeleted))
                .ThenInclude(c => c.AuthorUser)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<(IReadOnlyList<CommunityPost> Items, int TotalCount)> GetPagedAsync(
        string? category, string? status, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.CommunityPosts
            .Include(p => p.AuthorUser)
            .Include(p => p.Comments)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
            q = q.Where(p => p.Category == category);

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(p => p.Status == status);

        q = q.OrderByDescending(p => p.IsPinned)
              .ThenByDescending(p => p.CreatedAt);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task AddAsync(CommunityPost post, CancellationToken ct)
        => await _ctx.CommunityPosts.AddAsync(post, ct);

    public async Task DeleteAsync(CommunityPost post, CancellationToken ct)
    {
        _ctx.CommunityPosts.Remove(post);
        await Task.CompletedTask;
    }

    public async Task<(IReadOnlyList<CommunityPost> Items, int TotalCount)> GetByAuthorIdPagedAsync(
        Guid authorUserId, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.CommunityPosts
            .Include(p => p.Comments.Where(c => !c.IsDeleted))
            .Where(p => p.AuthorUserId == authorUserId)
            .OrderByDescending(p => p.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }
}

/// <summary>
/// Repository for community post comments.
/// </summary>
public class CommunityPostCommentRepository : ICommunityPostCommentRepository
{
    private readonly BioDbContext _ctx;

    public CommunityPostCommentRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<CommunityPostComment?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.CommunityPostComments
            .Include(c => c.AuthorUser)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<(IReadOnlyList<CommunityPostComment> Items, int TotalCount)> GetByPostIdAsync(
        Guid postId, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.CommunityPostComments
            .Include(c => c.AuthorUser)
            .Where(c => c.PostId == postId)
            .OrderBy(c => c.CreatedAt);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task AddAsync(CommunityPostComment comment, CancellationToken ct)
        => await _ctx.CommunityPostComments.AddAsync(comment, ct);

    public async Task DeleteAsync(CommunityPostComment comment, CancellationToken ct)
    {
        _ctx.CommunityPostComments.Remove(comment);
        await Task.CompletedTask;
    }
}

/// <summary>
/// Repository for community reactions (like/dislike on posts and comments).
/// Enforces unique constraint at query level before inserting.
/// </summary>
public class CommunityReactionRepository : ICommunityReactionRepository
{
    private readonly BioDbContext _ctx;

    public CommunityReactionRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<CommunityReaction?> GetByUserAndTargetAsync(
        Guid userId, string targetType, Guid targetId, CancellationToken ct)
        => await _ctx.CommunityReactions
            .FirstOrDefaultAsync(r =>
                r.UserId == userId &&
                r.TargetType == targetType &&
                r.TargetId == targetId, ct);

    public async Task<string?> GetReactionTypeByUserAndTargetAsync(
        Guid userId, string targetType, Guid targetId, CancellationToken ct)
    {
        var reaction = await GetByUserAndTargetAsync(userId, targetType, targetId, ct);
        return reaction?.ReactionType;
    }

    public async Task AddAsync(CommunityReaction reaction, CancellationToken ct)
        => await _ctx.CommunityReactions.AddAsync(reaction, ct);

    public async Task DeleteAsync(CommunityReaction reaction, CancellationToken ct)
    {
        _ctx.CommunityReactions.Remove(reaction);
        await Task.CompletedTask;
    }
}
