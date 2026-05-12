using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Users.Queries;

// =============================================================================
// GET USERS (Admin paginated query with filters)
// =============================================================================

public record GetUsersQuery(UserFilterParams Params) : IRequest<PaginatedResult<UserListItemDTO>>;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, PaginatedResult<UserListItemDTO>>
{
    private readonly IUserRepository _userRepo;
    private readonly IUserRoleRepository _userRoleRepo;

    public GetUsersQueryHandler(IUserRepository userRepo, IUserRoleRepository userRoleRepo)
    { _userRepo = userRepo; _userRoleRepo = userRoleRepo; }

    public async Task<PaginatedResult<UserListItemDTO>> Handle(GetUsersQuery request, CancellationToken ct)
    {
        var p = request.Params;
        var (users, total) = await _userRepo.GetFilteredPagedAsync(
            p.Search, p.RoleName, p.IsActive, p.IsVerified,
            p.FromDate, p.ToDate, p.Page, p.PageSize, ct);

        var dtos = new List<UserListItemDTO>();
        foreach (var user in users)
        {
            var roleDetails = await _userRoleRepo.GetByUserIdWithDetailsAsync(user.Id);
            var roleNames = roleDetails.Select(r => r.RoleName).ToList();
            dtos.Add(new UserListItemDTO(
                user.Id, user.FullName, user.Email, user.PhoneNumber,
                user.IsActive, user.IsVerified, user.TwoFactorEnabled,
                user.CreatedAt, user.LastLogin, roleNames));
        }

        return PaginatedResult<UserListItemDTO>.Create(dtos, total, p.Page, p.PageSize);
    }
}
