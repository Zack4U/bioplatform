using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

/// Database context for the BioPlatform platform.
/// Acts as the main bridge between domain entities and the SQL Server database.
public class BioDbContext : DbContext
{
    /// Initializes a new instance of <see cref="BioDbContext"/>.
    public BioDbContext(DbContextOptions<BioDbContext> options) : base(options)
    {
    }

    /// Collection of security roles in the system.
    public DbSet<Role> Roles { get; set; }

    /// Collection of registered users in the system.
    public DbSet<User> Users { get; set; }

    /// Collection of user-role assignments.
    public DbSet<UserRole> UserRoles { get; set; }

    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<ProductCategory> ProductCategories { get; set; } = null!;
    public DbSet<ProductReview> ProductReviews { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;
    public DbSet<AbsPermit> AbsPermits { get; set; } = null!;
    public DbSet<SustainabilityCert> SustainabilityCerts { get; set; } = null!;
    public DbSet<ProductCert> ProductCerts { get; set; } = null!;
    public DbSet<TraceabilityBatch> TraceabilityBatches { get; set; } = null!;
    public DbSet<Certification> Certifications { get; set; } = null!;

    /// Configures the data model and mapping rules using Fluent API.
    /// Executed when the model for the context is being initialized.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            // Define the primary key
            entity.HasKey(e => e.Id);

            // Integrity and length rules for fields
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Salt).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);

            // Ensures that no duplicate emails exist
            entity.HasIndex(e => e.Email).IsUnique();

            // Ensures that no duplicate phone numbers exist, ignoring nulls and empty strings
            entity.HasIndex(u => u.PhoneNumber)
                .IsUnique()
                .HasFilter("[PhoneNumber] IS NOT NULL AND [PhoneNumber] <> ''");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(2000);

            // Ensures that no duplicate role names exist
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });

            entity.HasOne(ur => ur.User)
                .WithMany()
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ur => ur.Role)
                .WithMany()
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RefreshTokens
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ProductCategories
        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Products
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.EntrepreneurId);
            entity.HasIndex(e => e.BaseSpeciesId); // Logical FK to PostgreSQL
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Entrepreneur)
                  .WithMany()
                  .HasForeignKey(e => e.EntrepreneurId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<ProductCategory>()
                  .WithMany(pc => pc.Products)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ProductReviews
        modelBuilder.Entity<ProductReview>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Reviews)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId);
        });

        // Orders
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BuyerId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.SubtotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ShippingAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Buyer)
                  .WithMany()
                  .HasForeignKey(e => e.BuyerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // OrderItems
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Order)
                  .WithMany(o => o.OrderItems)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AbsPermits
        modelBuilder.Entity<AbsPermit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SpeciesId); // Logical FK
            entity.HasIndex(e => e.ResolutionNumber).IsUnique();
        });

        // SustainabilityCerts
        modelBuilder.Entity<SustainabilityCert>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // ProductCerts (Many-to-Many)
        modelBuilder.Entity<ProductCert>(entity =>
        {
            entity.HasKey(e => new { e.ProductId, e.CertId });
            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Cert)
                  .WithMany()
                  .HasForeignKey(e => e.CertId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // TraceabilityBatches
        modelBuilder.Entity<TraceabilityBatch>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BatchCode).IsUnique();
            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Certifications
        modelBuilder.Entity<Certification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Certifications)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
