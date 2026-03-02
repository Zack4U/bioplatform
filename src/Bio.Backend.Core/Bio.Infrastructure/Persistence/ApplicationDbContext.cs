using Bio.Application.Common.Interfaces;
using Bio.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Bio.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Mapeo exacto según tu esquema SQL Server
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products", "dbo");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).IsRequired(); // nvarchar(max)
            entity.Property(e => e.ShortDescription).HasMaxLength(300);

            // Configuración de precisión para Precios
            entity.Property(e => e.Price)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(e => e.CompareAtPrice)
                .HasColumnType("decimal(18,2)");

            entity.Property(e => e.Sku).HasMaxLength(50);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.Tags).HasMaxLength(500);

            // Relaciones Lógicas (UUIDs)
            entity.Property(e => e.EntrepreneurId).IsRequired();
            entity.Property(e => e.BaseSpeciesId).IsRequired();
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders", "dbo"); // ESQUEMA EXPLÍCITO
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OrderNumber).IsUnique();

            // Configurar precisión decimal para evitar truncado (Solución a advertencias)
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.SubtotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ShippingAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");

            // DEFINIR RELACIÓN EXPLÍCITA
            entity.HasMany(o => o.OrderItems)
                  .WithOne()
                  .HasForeignKey(oi => oi.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems", "dbo"); // ESQUEMA EXPLÍCITO
            entity.HasKey(e => e.Id);

            // Configurar precisión decimal
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return base.SaveChangesAsync(cancellationToken);
    }
}