using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

/// <summary>
/// Database context for the Scientific/Biodiversity catalog (PostgreSQL).
/// </summary>
public class ScientificDbContext : DbContext
{
    public ScientificDbContext(DbContextOptions<ScientificDbContext> options) : base(options)
    {
    }

    public DbSet<Taxonomy> Taxonomies { get; set; } = null!;
    public DbSet<Species> Species { get; set; } = null!;
    public DbSet<GeographicDistribution> GeographicDistributions { get; set; } = null!;
    public DbSet<SpeciesImage> SpeciesImages { get; set; } = null!;
    public DbSet<PredictionLog> PredictionLogs { get; set; } = null!;
    public DbSet<BusinessPlan> BusinessPlans { get; set; } = null!;
    public DbSet<ChatSession> ChatSessions { get; set; } = null!;
    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
    public DbSet<RagDocument> RagDocuments { get; set; } = null!;

    // Transactional Entities (Moved from BioDbContext)
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<UserRole> UserRoles { get; set; } = null!;
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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Enforce snake_case for PostgreSQL tables automatically using EF Core conventions
        // or explicitly configure them. For now, we rely on standard conventions.

        // Tablas y columnas alineadas al script PostgreSQL (snake_case)
        modelBuilder.Entity<Taxonomy>(entity =>
        {
            entity.ToTable("taxonomy");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Kingdom).HasColumnName("kingdom").HasMaxLength(50);
            entity.Property(e => e.Phylum).HasColumnName("phylum").HasMaxLength(50);
            entity.Property(e => e.ClassName).HasColumnName("class_name").HasMaxLength(50);
            entity.Property(e => e.OrderName).HasColumnName("order_name").HasMaxLength(50);
            entity.Property(e => e.Family).HasColumnName("family").HasMaxLength(50);
            entity.Property(e => e.Genus).HasColumnName("genus").HasMaxLength(50);
            entity.HasIndex(e => e.Family);
            entity.HasIndex(e => e.Genus);
        });

        modelBuilder.Entity<Species>(entity =>
        {
            entity.ToTable("species");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TaxonomyId).HasColumnName("taxonomy_id");
            entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(150);
            entity.Property(e => e.ThumbnailUrl).HasColumnName("thumbnail_url").HasMaxLength(500);
            entity.Property(e => e.ScientificName).HasColumnName("scientific_name").HasMaxLength(255);
            entity.Property(e => e.CommonName).HasColumnName("common_name").HasMaxLength(255);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.EcologicalInfo).HasColumnName("ecological_info");
            entity.Property(e => e.TraditionalUses).HasColumnName("traditional_uses");
            entity.Property(e => e.EconomicPotential).HasColumnName("economic_potential");
            entity.Property(e => e.AltitudeRange).HasColumnName("altitude_range").HasMaxLength(100);
            entity.Property(e => e.LegalStatus).HasColumnName("legal_status").HasDefaultValue(false);
            entity.Property(e => e.ConservationStatus).HasColumnName("conservation_status").HasMaxLength(100);
            entity.Property(e => e.IsSensitive).HasColumnName("is_sensitive");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.ScientificName).IsUnique();

            // JSON columns for structured data (PostgreSQL jsonb)
            entity.Property(e => e.TraditionalUses).HasColumnType("jsonb");
            entity.Property(e => e.EconomicPotential).HasColumnType("jsonb");

            // Conservation
            entity.Property(e => e.IsSensitive).HasDefaultValue(false);

            // Note: Trigram indexes and specialized GIN ops are configured via migrations/fluent API
            entity.HasOne(e => e.Taxonomy)
                  .WithMany(t => t.Species)
                  .HasForeignKey(e => e.TaxonomyId);
        });

        modelBuilder.Entity<GeographicDistribution>(entity =>
        {
            entity.ToTable("geographic_distribution");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SpeciesId).HasColumnName("species_id");
            entity.Property(e => e.Latitude).HasColumnName("latitude");
            entity.Property(e => e.Longitude).HasColumnName("longitude");
            entity.Property(e => e.Altitude).HasColumnName("altitude");
            entity.Property(e => e.Municipality).HasColumnName("municipality").HasMaxLength(100);
            entity.Property(e => e.EcosystemType).HasColumnName("ecosystem_type").HasMaxLength(100);
            
            if (Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory" && Database.ProviderName != "Microsoft.EntityFrameworkCore.Sqlite")
            {
                entity.Property(e => e.LocationPoint).HasColumnName("location_point");
            }
            else
            {
                entity.Ignore(e => e.LocationPoint);
            }

            entity.HasOne(e => e.Species)
                  .WithMany(s => s.GeographicDistributions)
                  .HasForeignKey(e => e.SpeciesId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SpeciesImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Species)
                  .WithMany()
                  .HasForeignKey(e => e.SpeciesId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BusinessPlan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.EntrepreneurId);
        });

        modelBuilder.Entity<RagDocument>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Species)
                  .WithMany()
                  .HasForeignKey(e => e.SpeciesId);
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId); // Logical FK to SQL Server
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Session)
                  .WithMany(s => s.Messages)
                  .HasForeignKey(e => e.SessionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Transactional Configurations (Moved from BioDbContext and adapted to PG)
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.FullName).HasColumnName("full_name").IsRequired().HasMaxLength(150);
            entity.Property(e => e.Email).HasColumnName("email").IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").IsRequired().HasMaxLength(500);
            entity.Property(e => e.Salt).HasColumnName("salt").IsRequired().HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20);
            entity.Property(e => e.IsVerified).HasColumnName("is_verified");
            entity.Property(e => e.LastLogin).HasColumnName("last_login");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.TwoFactorEnabled).HasColumnName("two_factor_enabled");
            entity.Property(e => e.TwoFactorSecret).HasColumnName("two_factor_secret");
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.PhoneNumber).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.AssignedAt).HasColumnName("assigned_at");

            entity.HasOne(ur => ur.User)
                  .WithMany()
                  .HasForeignKey(ur => ur.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ur => ur.Role)
                  .WithMany()
                  .HasForeignKey(ur => ur.RoleId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Token).HasColumnName("token").IsRequired().HasMaxLength(500);
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.RevokedAt).HasColumnName("revoked_at");
            entity.Property(e => e.ReplacedByToken).HasColumnName("replaced_by_token");

            entity.HasOne(rt => rt.User)
                  .WithMany()
                  .HasForeignKey(rt => rt.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.ToTable("product_categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.EntrepreneurId).HasColumnName("entrepreneur_id");
            entity.Property(e => e.BaseSpeciesId).HasColumnName("base_species_id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Slug).HasColumnName("slug").IsRequired().HasMaxLength(150);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Price).HasColumnName("price");
            entity.Property(e => e.StockQuantity).HasColumnName("stock_quantity");
            entity.Property(e => e.Sku).HasColumnName("sku").HasMaxLength(50);
            entity.Property(e => e.ThumbnailUrl).HasColumnName("thumbnail_url").HasMaxLength(500);
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.EntrepreneurId);
            entity.HasIndex(e => e.BaseSpeciesId);

            entity.HasOne(e => e.Entrepreneur)
                  .WithMany()
                  .HasForeignKey(e => e.EntrepreneurId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Category)
                  .WithMany(pc => pc.Products)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.BaseSpecies)
                  .WithMany()
                  .HasForeignKey(e => e.BaseSpeciesId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductReview>(entity =>
        {
            entity.ToTable("product_reviews");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.Title).HasColumnName("title");
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Reviews)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BuyerId).HasColumnName("buyer_id");
            entity.Property(e => e.OrderNumber).HasColumnName("order_number").IsRequired();
            entity.Property(e => e.TotalAmount).HasColumnName("total_amount");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.HasOne(e => e.Buyer)
                  .WithMany()
                  .HasForeignKey(e => e.BuyerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("order_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.UnitPrice).HasColumnName("unit_price");
            entity.Property(e => e.TotalPrice).HasColumnName("total_price");

            entity.HasOne(e => e.Order)
                  .WithMany(o => o.OrderItems)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AbsPermit>(entity =>
        {
            entity.ToTable("abs_permits");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ResolutionNumber).HasColumnName("resolution_number").IsRequired();
            entity.Property(e => e.SpeciesId).HasColumnName("species_id");
            entity.Property(e => e.EntrepreneurId).HasColumnName("entrepreneur_id");

            entity.HasIndex(e => e.ResolutionNumber).IsUnique();
            entity.HasOne(e => e.Entrepreneur)
                  .WithMany()
                  .HasForeignKey(e => e.EntrepreneurId);
        });

        modelBuilder.Entity<SustainabilityCert>(entity =>
        {
            entity.ToTable("sustainability_certs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired();
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<ProductCert>(entity =>
        {
            entity.ToTable("product_certs");
            entity.HasKey(e => new { e.ProductId, e.CertId });
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.CertId).HasColumnName("cert_id");

            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId);
            entity.HasOne(e => e.Cert)
                  .WithMany()
                  .HasForeignKey(e => e.CertId);
        });

        modelBuilder.Entity<TraceabilityBatch>(entity =>
        {
            entity.ToTable("traceability_batches");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.BatchCode).HasColumnName("batch_code").IsRequired();
            entity.HasIndex(e => e.BatchCode).IsUnique();

            entity.HasOne(e => e.Product)
                  .WithMany()
                  .HasForeignKey(e => e.ProductId);
        });

        modelBuilder.Entity<Certification>(entity =>
        {
            entity.ToTable("certifications");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Certifications)
                  .HasForeignKey(e => e.ProductId);
        });

        // Seed Roles in PG
        modelBuilder.Entity<Role>().HasData(
            new Role(Guid.NewGuid(), global::Bio.Domain.Constants.RoleNames.Admin, "System Administrator"),
            new Role(Guid.NewGuid(), global::Bio.Domain.Constants.RoleNames.Researcher, "Scientific Researcher"),
            new Role(Guid.NewGuid(), global::Bio.Domain.Constants.RoleNames.Entrepreneur, "Green Entrepreneur"),
            new Role(Guid.NewGuid(), global::Bio.Domain.Constants.RoleNames.Community, "Local Community Member"),
            new Role(Guid.NewGuid(), global::Bio.Domain.Constants.RoleNames.Buyer, "Standard Buyer/Consumer"),
            new Role(Guid.NewGuid(), global::Bio.Domain.Constants.RoleNames.EnvironmentalAuthority, "Environmental Regulatory Authority")
        );
    }
}
