using Bio.Application.DTOs;
using Bio.Application.Features.Community.Comments.Commands;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Community.Comments.Queries;

// =============================================================================
// GET COMMENTS BY POST (paged)
// =============================================================================

public record GetCommentsByPostQuery(
    Guid PostId, int Page, int PageSize) : IRequest<PaginatedResult<CommunityCommentResponseDTO>>;

public class GetCommentsByPostQueryHandler
    : IRequestHandler<GetCommentsByPostQuery, PaginatedResult<CommunityCommentResponseDTO>>
{
    private readonly ICommunityPostCommentRepository _repo;
    private readonly ICommunityPostRepository _postRepo;

    public GetCommentsByPostQueryHandler(
        ICommunityPostCommentRepository repo,
        ICommunityPostRepository postRepo)
    { _repo = repo; _postRepo = postRepo; }

    public async Task<PaginatedResult<CommunityCommentResponseDTO>> Handle(
        GetCommentsByPostQuery request, CancellationToken ct)
    {
        _ = await _postRepo.GetByIdAsync(request.PostId, ct)
            ?? throw new NotFoundException(nameof(Bio.Domain.Entities.CommunityPost), request.PostId);

        var (items, total) = await _repo.GetByPostIdAsync(
            request.PostId, request.Page, request.PageSize, ct);

        var dtos = items.Select(CommunityCommentMapper.ToResponse).ToList();
        return PaginatedResult<CommunityCommentResponseDTO>.Create(
            dtos, total, request.Page, request.PageSize);
    }
}
