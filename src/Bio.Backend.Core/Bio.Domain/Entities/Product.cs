namespace Bio.Domain.Entities;

public class Product
{
    // Identificadores y Relaciones Bio (UUIDs)
    public Guid Id { get; set; }
    public Guid EntrepreneurId { get; set; } // FK hacia Users
    public Guid BaseSpeciesId { get; set; } // FK lógica hacia PostgreSQL

    // Información del Producto
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }

    // Precios (decimal 18,2)
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }

    // Inventario y Clasificación
    public int StockQuantity { get; set; }
    public string? Sku { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public string? ImageUrls { get; set; } // Almacenado como string/JSON en SQL

    // Estados y Auditoría
    public bool? IsActive { get; set; }
    public bool? IsFeatured { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

// En e:\Proyecto Integrador\bioplatform\src\Bio.Backend.Core\Bio.Infrastructure\Persistence\ApplicationDbContext.cs
// builder.Entity<Product>()
//     .Property(p => p.Price)
//     .HasPrecision(18, 2);