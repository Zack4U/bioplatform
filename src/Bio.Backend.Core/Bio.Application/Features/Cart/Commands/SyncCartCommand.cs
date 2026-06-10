using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Cart.Commands;

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC CART — Merges a guest/local cart with the authenticated user's server cart.
// Called once on login: local items from Zustand are upserted into the DB cart.
// ═══════════════════════════════════════════════════════════════════════════════
public record SyncCartCommand(Guid UserId, CartSyncRequestDTO Dto) : IRequest<CartResponseDTO>;

public class SyncCartCommandHandler : IRequestHandler<SyncCartCommand, CartResponseDTO>
{
    private readonly ICartRepository _cartRepo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public SyncCartCommandHandler(
        ICartRepository cartRepo, IProductRepository productRepo, IUnitOfWork uow)
    { _cartRepo = cartRepo; _productRepo = productRepo; _uow = uow; }

    public async Task<CartResponseDTO> Handle(SyncCartCommand request, CancellationToken ct)
    {
        if (request.Dto.Items.Count == 0)
        {
            // No local items — just return existing server cart (or empty)
            var existing = await _cartRepo.GetByUserIdAsync(request.UserId, ct);
            return existing is null
                ? new CartResponseDTO(Guid.Empty, request.UserId, [], 0, DateTime.UtcNow)
                : CartMapper.MapCart(existing);
        }

        // Get or create server-side cart
        var cart = await _cartRepo.GetByUserIdAsync(request.UserId, ct);
        if (cart is null)
        {
            cart = new Domain.Entities.Cart(request.UserId);
            await _cartRepo.AddAsync(cart, ct);
            await _uow.SaveChangesAsync(ct);
        }

        // Upsert each local item: validate product exists & is active, then merge
        foreach (var syncItem in request.Dto.Items)
        {
            var product = await _productRepo.GetByIdAsync(syncItem.ProductId, ct);
            if (product is null || !product.IsActive) continue; // Skip invalid products silently

            var existing = await _cartRepo.GetItemByProductAsync(cart.Id, syncItem.ProductId, ct);
            if (existing is not null)
            {
                // Server quantity wins — local already had it; keep max of the two
                var merged = Math.Max(existing.Quantity, syncItem.Quantity);
                existing.UpdateQuantity(Math.Min(merged, product.StockQuantity));
            }
            else
            {
                var qty = Math.Min(syncItem.Quantity, product.StockQuantity);
                if (qty > 0)
                    await _cartRepo.AddItemAsync(new CartItem(cart.Id, syncItem.ProductId, qty), ct);
            }
        }

        cart.Touch();
        await _uow.SaveChangesAsync(ct);

        var updated = await _cartRepo.GetByUserIdAsync(request.UserId, ct);
        return CartMapper.MapCart(updated!);
    }
}
