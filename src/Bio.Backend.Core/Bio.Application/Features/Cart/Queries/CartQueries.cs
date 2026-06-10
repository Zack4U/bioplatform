using Bio.Application.DTOs;
using Bio.Application.Features.Cart.Commands;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Cart.Queries;

public record GetCartQuery(Guid UserId) : IRequest<CartResponseDTO?>;

public class GetCartQueryHandler : IRequestHandler<GetCartQuery, CartResponseDTO?>
{
    private readonly ICartRepository _repo;

    public GetCartQueryHandler(ICartRepository repo) => _repo = repo;

    public async Task<CartResponseDTO?> Handle(GetCartQuery request, CancellationToken ct)
    {
        var cart = await _repo.GetByUserIdAsync(request.UserId, ct);
        if (cart is null) return null;
        return CartMapper.MapCart(cart);
    }
}
