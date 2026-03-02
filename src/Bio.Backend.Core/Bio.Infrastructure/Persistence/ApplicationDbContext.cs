using Bio.Application.Common.Interfaces;
using Bio.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Bio.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();

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
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return base.SaveChangesAsync(cancellationToken);
    }
}