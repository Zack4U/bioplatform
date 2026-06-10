using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Bio.Application.Features.Cart.Commands;

// ── Helpers ───────────────────────────────────────────────────────────────────

internal static class CartMapper
{
    internal static CartItemResponseDTO MapItem(CartItem i) => new(
        i.Id, i.ProductId,
        i.Product?.Name ?? string.Empty,
        i.Product?.ThumbnailUrl,
        i.Quantity, i.IsActive,
        i.CreatedAt, i.UpdatedAt);

    internal static CartResponseDTO MapCart(Domain.Entities.Cart c) => new(
        c.Id, c.UserId,
        c.Items.Select(MapItem).ToList(),
        c.Items.Count(i => i.IsActive),
        c.UpdatedAt);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD ITEM TO CART (upsert: if product already exists, increment quantity)
// ═══════════════════════════════════════════════════════════════════════════════
public record AddCartItemCommand(Guid UserId, CartItemAddDTO Dto) : IRequest<CartResponseDTO>;

public class AddCartItemCommandHandler : IRequestHandler<AddCartItemCommand, CartResponseDTO>
{
    private readonly ICartRepository _cartRepo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;
    private readonly ILogger<AddCartItemCommandHandler> _logger;

    public AddCartItemCommandHandler(
        ICartRepository cartRepo, IProductRepository productRepo,
        IUnitOfWork uow, ILogger<AddCartItemCommandHandler> logger)
    { _cartRepo = cartRepo; _productRepo = productRepo; _uow = uow; _logger = logger; }

    public async Task<CartResponseDTO> Handle(AddCartItemCommand request, CancellationToken ct)
    {
        // Validate product exists and is active
        var product = await _productRepo.GetByIdAsync(request.Dto.ProductId, ct)
            ?? throw new NotFoundException(nameof(Product), request.Dto.ProductId);
        if (!product.IsActive)
            throw new ValidationException($"Product '{product.Name}' is not available for purchase.");

        // Get or create cart
        var cart = await _cartRepo.GetByUserIdAsync(request.UserId, ct);
        if (cart is null)
        {
            cart = new Domain.Entities.Cart(request.UserId);
            await _cartRepo.AddAsync(cart, ct);
            await _uow.SaveChangesAsync(ct); // persist cart so we have a valid Id
            _logger.LogInformation("Created new cart {CartId} for user {UserId}", cart.Id, request.UserId);
        }

        // Upsert: if item already in cart, just increase quantity
        var existing = await _cartRepo.GetItemByProductAsync(cart.Id, request.Dto.ProductId, ct);
        if (existing is not null)
        {
            existing.UpdateQuantity(existing.Quantity + request.Dto.Quantity);
        }
        else
        {
            var item = new CartItem(cart.Id, request.Dto.ProductId, request.Dto.Quantity);
            await _cartRepo.AddItemAsync(item, ct);
        }

        cart.Touch();
        await _uow.SaveChangesAsync(ct);

        var updated = await _cartRepo.GetByUserIdAsync(request.UserId, ct);
        return CartMapper.MapCart(updated!);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE CART ITEM QUANTITY
// ═══════════════════════════════════════════════════════════════════════════════
public record UpdateCartItemCommand(Guid UserId, Guid ItemId, CartItemUpdateDTO Dto) : IRequest<CartResponseDTO>;

public class UpdateCartItemCommandHandler : IRequestHandler<UpdateCartItemCommand, CartResponseDTO>
{
    private readonly ICartRepository _cartRepo;
    private readonly IUnitOfWork _uow;

    public UpdateCartItemCommandHandler(ICartRepository cartRepo, IUnitOfWork uow)
    { _cartRepo = cartRepo; _uow = uow; }

    public async Task<CartResponseDTO> Handle(UpdateCartItemCommand request, CancellationToken ct)
    {
        var item = await _cartRepo.GetItemByIdAsync(request.ItemId, ct)
            ?? throw new NotFoundException(nameof(CartItem), request.ItemId);

        var cart = await _cartRepo.GetByIdWithItemsAsync(item.CartId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.Cart), item.CartId);

        if (cart.UserId != request.UserId)
            throw new ForbiddenException("You can only manage your own cart.");

        item.UpdateQuantity(request.Dto.Quantity);
        cart.Touch();
        await _uow.SaveChangesAsync(ct);

        var updated = await _cartRepo.GetByUserIdAsync(request.UserId, ct);
        return CartMapper.MapCart(updated!);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOGGLE CART ITEM ACTIVE/INACTIVE
// ═══════════════════════════════════════════════════════════════════════════════
public record ToggleCartItemCommand(Guid UserId, Guid ItemId) : IRequest<CartResponseDTO>;

public class ToggleCartItemCommandHandler : IRequestHandler<ToggleCartItemCommand, CartResponseDTO>
{
    private readonly ICartRepository _cartRepo;
    private readonly IUnitOfWork _uow;

    public ToggleCartItemCommandHandler(ICartRepository cartRepo, IUnitOfWork uow)
    { _cartRepo = cartRepo; _uow = uow; }

    public async Task<CartResponseDTO> Handle(ToggleCartItemCommand request, CancellationToken ct)
    {
        var item = await _cartRepo.GetItemByIdAsync(request.ItemId, ct)
            ?? throw new NotFoundException(nameof(CartItem), request.ItemId);

        var cart = await _cartRepo.GetByIdWithItemsAsync(item.CartId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.Cart), item.CartId);

        if (cart.UserId != request.UserId)
            throw new ForbiddenException("You can only manage your own cart.");

        item.Toggle();
        cart.Touch();
        await _uow.SaveChangesAsync(ct);

        var updated = await _cartRepo.GetByUserIdAsync(request.UserId, ct);
        return CartMapper.MapCart(updated!);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REMOVE ITEM FROM CART
// ═══════════════════════════════════════════════════════════════════════════════
public record RemoveCartItemCommand(Guid UserId, Guid ItemId) : IRequest<CartResponseDTO>;

public class RemoveCartItemCommandHandler : IRequestHandler<RemoveCartItemCommand, CartResponseDTO>
{
    private readonly ICartRepository _cartRepo;
    private readonly IUnitOfWork _uow;

    public RemoveCartItemCommandHandler(ICartRepository cartRepo, IUnitOfWork uow)
    { _cartRepo = cartRepo; _uow = uow; }

    public async Task<CartResponseDTO> Handle(RemoveCartItemCommand request, CancellationToken ct)
    {
        var item = await _cartRepo.GetItemByIdAsync(request.ItemId, ct)
            ?? throw new NotFoundException(nameof(CartItem), request.ItemId);

        var cart = await _cartRepo.GetByIdWithItemsAsync(item.CartId, ct)
            ?? throw new NotFoundException(nameof(Domain.Entities.Cart), item.CartId);

        if (cart.UserId != request.UserId)
            throw new ForbiddenException("You can only manage your own cart.");

        await _cartRepo.RemoveItemAsync(item, ct);
        cart.Touch();
        await _uow.SaveChangesAsync(ct);

        var updated = await _cartRepo.GetByUserIdAsync(request.UserId, ct);
        return CartMapper.MapCart(updated!);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLEAR ALL ITEMS FROM CART
// ═══════════════════════════════════════════════════════════════════════════════
public record ClearCartCommand(Guid UserId) : IRequest<Unit>;

public class ClearCartCommandHandler : IRequestHandler<ClearCartCommand, Unit>
{
    private readonly ICartRepository _cartRepo;
    private readonly IUnitOfWork _uow;
    private readonly ILogger<ClearCartCommandHandler> _logger;

    public ClearCartCommandHandler(ICartRepository cartRepo, IUnitOfWork uow, ILogger<ClearCartCommandHandler> logger)
    { _cartRepo = cartRepo; _uow = uow; _logger = logger; }

    public async Task<Unit> Handle(ClearCartCommand request, CancellationToken ct)
    {
        var cart = await _cartRepo.GetByUserIdAsync(request.UserId, ct);
        if (cart is null) return Unit.Value; // Nothing to clear

        foreach (var item in cart.Items.ToList())
            await _cartRepo.RemoveItemAsync(item, ct);

        cart.Touch();
        await _uow.SaveChangesAsync(ct);
        _logger.LogInformation("Cleared cart {CartId} for user {UserId}", cart.Id, request.UserId);
        return Unit.Value;
    }
}
