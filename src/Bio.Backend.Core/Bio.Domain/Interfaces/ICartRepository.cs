using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repository for Cart and CartItem persistence operations.
/// One cart per user — enforced at DB level via unique index.
/// </summary>
public interface ICartRepository
{
    /// <summary>Gets the full cart with all items for the given user. Returns null if no cart exists.</summary>
    Task<Cart?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Gets cart by its primary key with all items included.</summary>
    Task<Cart?> GetByIdWithItemsAsync(Guid cartId, CancellationToken ct = default);

    /// <summary>Gets a single cart item by its ID.</summary>
    Task<CartItem?> GetItemByIdAsync(Guid itemId, CancellationToken ct = default);

    /// <summary>Adds a new cart to the store.</summary>
    Task AddAsync(Cart cart, CancellationToken ct = default);

    /// <summary>Adds a new item to an existing cart.</summary>
    Task AddItemAsync(CartItem item, CancellationToken ct = default);

    /// <summary>Removes a cart item from the store.</summary>
    Task RemoveItemAsync(CartItem item, CancellationToken ct = default);

    /// <summary>Returns true if a cart already has an item for the given product.</summary>
    Task<bool> ItemExistsAsync(Guid cartId, Guid productId, CancellationToken ct = default);

    /// <summary>Gets a cart item by cartId and productId (for upsert scenarios).</summary>
    Task<CartItem?> GetItemByProductAsync(Guid cartId, Guid productId, CancellationToken ct = default);
}
