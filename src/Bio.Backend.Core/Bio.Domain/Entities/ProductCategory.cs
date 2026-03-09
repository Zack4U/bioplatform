namespace Bio.Domain.Entities;

public class ProductCategory
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;

    public ICollection<Product> Products { get; private set; } = new List<Product>();

    private ProductCategory() { }

    public ProductCategory(string name)
    {
        Name = name;
    }
}
