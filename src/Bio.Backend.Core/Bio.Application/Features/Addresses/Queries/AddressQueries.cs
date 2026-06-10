using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;
using Bio.Application.Features.Addresses.Commands;

namespace Bio.Application.Features.Addresses.Queries;

public record GetMyAddressesQuery(Guid UserId) : IRequest<IReadOnlyList<AddressResponseDTO>>;

public class GetMyAddressesQueryHandler : IRequestHandler<GetMyAddressesQuery, IReadOnlyList<AddressResponseDTO>>
{
    private readonly IAddressRepository _repo;
    public GetMyAddressesQueryHandler(IAddressRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<AddressResponseDTO>> Handle(GetMyAddressesQuery request, CancellationToken ct)
    {
        var items = await _repo.GetByUserIdAsync(request.UserId, ct);
        return items.Select(CreateAddressCommandHandler.MapToResponse).ToList();
    }
}
