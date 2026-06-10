namespace Bio.Domain.Entities;

/// <summary>
/// A single item inside a shopping cart.
/// IsActive allows users to include/exclude items without removing them from the cart.
/// Prices are NOT stored — always resolved from Product.SellPrice at checkout time.
/// Table: CartItems (SQL Server).
/// </summary>
public class CartItem
{
    public Guid Id { get; private set; }
    public Guid CartId { get; private set; }
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }

    /// <summary>
    /// When false the item is "saved for later" — excluded from checkout total.
    /// When true the item is selected and will be included in the order.
    /// </summary>
    public bool IsActive { get; private set; } = true;

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    // Navigation properties
    public Cart Cart { get; private set; } = null!;
    public Product Product { get; private set; } = null!;

    private CartItem() { }

    public CartItem(Guid cartId, Guid productId, int quantity)
    {
        Id = Guid.NewGuid();
        CartId = cartId;
        ProductId = productId;
        Quantity = quantity;
        IsActive = true;
    }

    /// <summary>Updates the quantity for this cart item.</summary>
    public void UpdateQuantity(int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be positive.", nameof(quantity));
        Quantity = quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>Toggles the active/inactive state of this cart item.</summary>
    public void Toggle()
    {
        IsActive = !IsActive;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>Explicitly sets the active state.</summary>
    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }
}
