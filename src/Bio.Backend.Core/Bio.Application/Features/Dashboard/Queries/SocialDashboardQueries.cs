using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Dashboard.Queries;

// =============================================================================
// SOCIAL / COMMUNITY DASHBOARD (all authenticated users)
// =============================================================================

public record GetSocialDashboardQuery(Guid UserId) : IRequest<SocialDashboardDTO>;

public class GetSocialDashboardQueryHandler : IRequestHandler<GetSocialDashboardQuery, SocialDashboardDTO>
{
    private readonly ICommunityPostRepository _postRepo;
    private readonly IUserConnectionRepository _connRepo;
    private readonly IFavoriteRepository _favoriteRepo;
    private readonly IDirectThreadRepository _threadRepo;

    public GetSocialDashboardQueryHandler(
        ICommunityPostRepository postRepo,
        IUserConnectionRepository connRepo,
        IFavoriteRepository favoriteRepo,
        IDirectThreadRepository threadRepo)
    {
        _postRepo = postRepo; _connRepo = connRepo;
        _favoriteRepo = favoriteRepo; _threadRepo = threadRepo;
    }

    public async Task<SocialDashboardDTO> Handle(GetSocialDashboardQuery request, CancellationToken ct)
    {
        var (myPosts, _) = await _postRepo.GetByAuthorIdPagedAsync(request.UserId, 1, 1000, ct);
        var connections = (await _connRepo.GetByUserIdAsync(request.UserId, ct)).ToList();
        var (_, favProductCount) = await _favoriteRepo.GetByUserIdAsync(request.UserId, "Product", 1, 10000, ct);
        var (_, favSpeciesCount) = await _favoriteRepo.GetByUserIdAsync(request.UserId, "Species", 1, 10000, ct);
        var unreadMessages = await _threadRepo.GetUnreadMessageCountAsync(request.UserId, ct);

        var myPostList = myPosts.ToList();

        var totalLikes = myPostList.Sum(p => p.LikesCount);
        var totalDislikes = myPostList.Sum(p => p.DislikesCount);
        var totalComments = myPostList.Sum(p => p.Comments?.Count(c => !c.IsDeleted) ?? 0);

        var topPosts = myPostList
            .Where(p => p.Status == "Published")
            .OrderByDescending(p => p.LikesCount)
            .Take(5)
            .Select(p => new MyPostSummaryDTO(
                p.Id, p.Title, p.Status, p.LikesCount, p.DislikesCount,
                p.Comments?.Count(c => !c.IsDeleted) ?? 0, p.CreatedAt))
            .ToList();

        var activeConnections = connections.Count(c => c.Status == "Accepted");
        var pendingReceived = connections.Count(c => c.Status == "Pending" && c.AddresseeId == request.UserId);
        var sentPending = connections.Count(c => c.Status == "Pending" && c.RequesterId == request.UserId);

        return new SocialDashboardDTO(
            MyTotalPosts: myPostList.Count,
            MyPublishedPosts: myPostList.Count(p => p.Status == "Published"),
            MyDraftPosts: myPostList.Count(p => p.Status == "Draft"),
            TotalLikesReceived: totalLikes,
            TotalDislikesReceived: totalDislikes,
            TotalCommentsReceived: totalComments,
            TopPostsByLikes: topPosts,
            ActiveConnections: activeConnections,
            PendingConnectionRequests: pendingReceived,
            SentConnectionRequests: sentPending,
            UnreadDirectMessages: unreadMessages,
            FavoriteProductsCount: favProductCount,
            FavoriteSpeciesCount: favSpeciesCount);
    }
}
