using Bio.Application.DTOs;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using Bio.Application.Features.Community.Posts.Commands;
using MediatR;

namespace Bio.Application.Features.Community.Posts.Queries;

// =============================================================================
// GET ALL POSTS (paged, filterable by category and status)
// =============================================================================

public record GetCommunityPostsQuery(
    string? Category,
    string? Status,
    int Page,
    int PageSize) : IRequest<PaginatedResult<CommunityPostListItemDTO>>;

public class GetCommunityPostsQueryHandler
    : IRequestHandler<GetCommunityPostsQuery, PaginatedResult<CommunityPostListItemDTO>>
{
    private readonly ICommunityPostRepository _repo;
    private readonly ICacheService _cache;

    public GetCommunityPostsQueryHandler(ICommunityPostRepository repo, ICacheService cache)
    { _repo = repo; _cache = cache; }

    public async Task<PaginatedResult<CommunityPostListItemDTO>> Handle(
        GetCommunityPostsQuery request, CancellationToken ct)
    {
        // Cache public published posts (no category filter, page 1)
        var cacheKey = $"community:posts:{request.Category ?? "all"}:{request.Status ?? "Published"}:{request.Page}:{request.PageSize}";
        var cached = await _cache.GetAsync<PaginatedResult<CommunityPostListItemDTO>>(cacheKey, ct);
        if (cached is not null) return cached;

        var (items, total) = await _repo.GetPagedAsync(
            request.Category, request.Status ?? "Published", request.Page, request.PageSize, ct);

        var dtos = items.Select(p =>
            CommunityPostMapper.ToListItem(p, p.Comments.Count(c => !c.IsDeleted))
        ).ToList();

        var result = PaginatedResult<CommunityPostListItemDTO>.Create(
            dtos, total, request.Page, request.PageSize);

        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), ct);
        return result;
    }
}

// =============================================================================
// GET POST BY ID
// =============================================================================

public record GetCommunityPostByIdQuery(Guid PostId) : IRequest<CommunityPostDetailDTO>;

public class GetCommunityPostByIdQueryHandler
    : IRequestHandler<GetCommunityPostByIdQuery, CommunityPostDetailDTO>
{
    private readonly ICommunityPostRepository _repo;

    public GetCommunityPostByIdQueryHandler(ICommunityPostRepository repo) => _repo = repo;

    public async Task<CommunityPostDetailDTO> Handle(
        GetCommunityPostByIdQuery request, CancellationToken ct)
    {
        var post = await _repo.GetByIdWithCommentsAsync(request.PostId, ct)
            ?? throw new NotFoundException(nameof(Bio.Domain.Entities.CommunityPost), request.PostId);
        return CommunityPostMapper.ToDetail(post, post.Comments.Count(c => !c.IsDeleted));
    }
}
