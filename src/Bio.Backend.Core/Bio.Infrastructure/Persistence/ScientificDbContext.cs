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
            entity.Property(e => e.EconomicPotential).HasColumnName("economic_potential").HasMaxLength(255);
            entity.Property(e => e.ConservationStatus).HasColumnName("conservation_status").HasMaxLength(100);
            entity.Property(e => e.IsSensitive).HasColumnName("is_sensitive");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.ScientificName).IsUnique();
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
            entity.Property(e => e.LocationPoint).HasColumnName("location_point");
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
    }
}
