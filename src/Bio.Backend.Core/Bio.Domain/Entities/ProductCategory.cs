namespace Bio.Domain.Entities;

/// <summary>
/// Product categories for the marketplace.
/// Table: ProductCategories (SQL Server).
/// </summary>
public class ProductCategory
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;

    // Navigation property
    public ICollection<Product> Products { get; private set; } = new List<Product>();

    private ProductCategory() { }

    public ProductCategory(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Category name is required.", nameof(name));
        Name = name.Trim();
    }

    /// <summary>
    /// Updates the category name.
    /// </summary>
    public void Update(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Category name is required.", nameof(name));
        Name = name.Trim();
    }
}
