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
        
        modelBuilder.Entity<Taxonomy>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Family);
            entity.HasIndex(e => e.Genus);
        });

        modelBuilder.Entity<Species>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ScientificName).IsUnique();
            // Note: Trigram indexes and specialized GIN ops are configured via migrations/fluent API
            entity.HasOne(e => e.Taxonomy)
                  .WithMany(t => t.Species)
                  .HasForeignKey(e => e.TaxonomyId);
        });

        modelBuilder.Entity<GeographicDistribution>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Species)
                  .WithMany()
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
