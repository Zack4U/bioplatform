namespace Bio.Domain.Entities;

/// <summary>
/// Shopping cart for a user. One cart per user (enforced by unique index on UserId).
/// Prices are NOT stored here — they are resolved at checkout from the current Product.SellPrice.
/// Table: Carts (SQL Server).
/// </summary>
public class Cart
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; private set; } = null!;
    public ICollection<CartItem> Items { get; private set; } = new List<CartItem>();

    private Cart() { }

    public Cart(Guid userId)
    {
        Id = Guid.NewGuid();
        UserId = userId;
    }

    /// <summary>
    /// Marks the cart as updated (e.g., item added/removed/toggled).
    /// </summary>
    public void Touch() => UpdatedAt = DateTime.UtcNow;
}
