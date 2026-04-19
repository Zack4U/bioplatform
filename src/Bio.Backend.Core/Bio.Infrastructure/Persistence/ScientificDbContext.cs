using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

/// <summary>
/// Database context for the Scientific/Biodiversity catalog (PostgreSQL).
/// All tables and columns use snake_case per PostgreSQL conventions.
/// </summary>
public class ScientificDbContext : DbContext
{
    public ScientificDbContext(DbContextOptions<ScientificDbContext> options) : base(options)
    {
    }

    // --- Biodiversity Catalog ---
    public DbSet<Taxonomy> Taxonomies { get; set; } = null!;
    public DbSet<Species> Species { get; set; } = null!;
    public DbSet<GeographicDistribution> GeographicDistributions { get; set; } = null!;
    public DbSet<SpeciesImage> SpeciesImages { get; set; } = null!;

    // --- Species Enrichment (normalizado) ---
    public DbSet<SpeciesEconomicPotential> SpeciesEconomicPotentials { get; set; } = null!;
    public DbSet<SpeciesTraditionalUse> SpeciesTraditionalUses { get; set; } = null!;

    // --- Computer Vision & AI (MLOps) ---
    public DbSet<PredictionLog> PredictionLogs { get; set; } = null!;
    public DbSet<AiModelVersion> AiModelVersions { get; set; } = null!;

    // --- GenAI & Business Assistant ---
    public DbSet<BusinessPlan> BusinessPlans { get; set; } = null!;
    public DbSet<ChatSession> ChatSessions { get; set; } = null!;
    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
    public DbSet<RagDocument> RagDocuments { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // =====================================================================
        // BIODIVERSITY CATALOG
        // =====================================================================

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
            entity.Property(e => e.AltitudeRange).HasColumnName("altitude_range").HasMaxLength(100);
            entity.Property(e => e.LegalStatus).HasColumnName("legal_status").HasDefaultValue(false);
            entity.Property(e => e.ConservationStatus).HasColumnName("conservation_status").HasMaxLength(100);
            entity.Property(e => e.IsSensitive).HasColumnName("is_sensitive").HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.ScientificName).IsUnique();

            entity.HasOne(e => e.Taxonomy)
                  .WithMany(t => t.Species)
                  .HasForeignKey(e => e.TaxonomyId);

            entity.HasMany(e => e.Images)
                  .WithOne(i => i.Species)
                  .HasForeignKey(i => i.SpeciesId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.EconomicPotentials)
                  .WithOne(ep => ep.Species)
                  .HasForeignKey(ep => ep.SpeciesId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.TraditionalUses)
                  .WithOne(tu => tu.Species)
                  .HasForeignKey(tu => tu.SpeciesId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // =====================================================================
        // SPECIES ENRICHMENT — TABLAS NORMALIZADAS
        // =====================================================================

        modelBuilder.Entity<SpeciesEconomicPotential>(entity =>
        {
            entity.ToTable("species_economic_potentials");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SpeciesId).HasColumnName("species_id");
            entity.Property(e => e.Sector).HasColumnName("sector").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Products).HasColumnName("products").HasColumnType("text[]");
            entity.Property(e => e.ActiveProperties).HasColumnName("active_properties").HasColumnType("text[]");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.MarketValue).HasColumnName("market_value").HasMaxLength(50);
            entity.Property(e => e.SustainabilityLevel).HasColumnName("sustainability_level").HasMaxLength(50);
            entity.Property(e => e.Confidence).HasColumnName("confidence").HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(e => e.SpeciesId);
            entity.HasIndex(e => e.Sector);
        });

        modelBuilder.Entity<SpeciesTraditionalUse>(entity =>
        {
            entity.ToTable("species_traditional_uses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SpeciesId).HasColumnName("species_id");
            entity.Property(e => e.Part).HasColumnName("part").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Category).HasColumnName("category").HasColumnType("text[]");
            entity.Property(e => e.SpecificPurpose).HasColumnName("specific_purpose");
            entity.Property(e => e.PreparationMethod).HasColumnName("preparation_method");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Community).HasColumnName("community").HasMaxLength(200);
            entity.Property(e => e.TraditionalWarnings).HasColumnName("traditional_warnings");
            entity.Property(e => e.Confidence).HasColumnName("confidence").HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(e => e.SpeciesId);
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
            entity.ToTable("species_images");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SpeciesId).HasColumnName("species_id");
            entity.Property(e => e.UploaderUserId).HasColumnName("uploader_user_id");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url").HasMaxLength(500);
            entity.Property(e => e.ThumbnailUrl).HasColumnName("thumbnail_url").HasMaxLength(500);
            entity.Property(e => e.Metadata).HasColumnName("metadata").HasColumnType("jsonb");
            entity.Property(e => e.IsPrimary).HasColumnName("is_primary").HasDefaultValue(false);
            entity.Property(e => e.IsValidatedByExpert).HasColumnName("is_validated_by_expert").HasDefaultValue(false);
            entity.Property(e => e.ValidatedByUserId).HasColumnName("validated_by_user_id");
            entity.Property(e => e.ValidationDate).HasColumnName("validation_date");
            entity.Property(e => e.LicenseType).HasColumnName("license_type").HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            // Note: Species → SpeciesImage relationship is configured in the
            // Species entity block above to avoid shadow FK (SpeciesId1) issues.
            entity.HasIndex(e => e.SpeciesId);
            entity.HasIndex(e => e.IsValidatedByExpert);
        });

        // =====================================================================
        // COMPUTER VISION & AI (MLOps)
        // =====================================================================

        modelBuilder.Entity<PredictionLog>(entity =>
        {
            entity.ToTable("prediction_logs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.ImageInputUrl).HasColumnName("image_input_url").HasMaxLength(500);
            entity.Property(e => e.RawPredictionResult).HasColumnName("raw_prediction_result").HasColumnType("jsonb");
            entity.Property(e => e.TopPredictionSpeciesId).HasColumnName("top_prediction_species_id");
            entity.Property(e => e.ConfidenceScore).HasColumnName("confidence_score").HasColumnType("numeric(5,4)");
            entity.Property(e => e.FeedbackCorrect).HasColumnName("feedback_correct");
            entity.Property(e => e.FeedbackActualSpeciesId).HasColumnName("feedback_actual_species_id");
            entity.Property(e => e.ProcessingTimeMs).HasColumnName("processing_time_ms");
            entity.Property(e => e.ModelVersion).HasColumnName("model_version").HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<AiModelVersion>(entity =>
        {
            entity.ToTable("ai_model_versions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.ModelName).HasColumnName("model_name").HasMaxLength(100);
            entity.Property(e => e.Version).HasColumnName("version").HasMaxLength(20);
            entity.Property(e => e.AccuracyMetric).HasColumnName("accuracy_metric").HasColumnType("numeric(5,4)");
            entity.Property(e => e.DeployedAt).HasColumnName("deployed_at");
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(false);
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(e => e.Version).IsUnique();
        });

        // =====================================================================
        // GENAI & BUSINESS ASSISTANT
        // =====================================================================

        modelBuilder.Entity<BusinessPlan>(entity =>
        {
            entity.ToTable("business_plans");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.EntrepreneurId).HasColumnName("entrepreneur_id");
            entity.Property(e => e.ProjectTitle).HasColumnName("project_title").HasMaxLength(200);
            entity.Property(e => e.SpeciesIds).HasColumnName("species_ids");
            entity.Property(e => e.GeneratedContent).HasColumnName("generated_content");
            entity.Property(e => e.MarketAnalysisData).HasColumnName("market_analysis_data").HasColumnType("jsonb");
            entity.Property(e => e.FinancialProjections).HasColumnName("financial_projections").HasColumnType("jsonb");
            entity.Property(e => e.GenerationPrompt).HasColumnName("generation_prompt");
            entity.Property(e => e.ModelUsed).HasColumnName("model_used").HasMaxLength(50);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(e => e.EntrepreneurId);
        });

        modelBuilder.Entity<RagDocument>(entity =>
        {
            entity.ToTable("rag_documents");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(200);
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.SourceType).HasColumnName("source_type").HasMaxLength(50);
            entity.Property(e => e.SourceUrl).HasColumnName("source_url").HasMaxLength(500);
            entity.Property(e => e.SpeciesId).HasColumnName("species_id");
            entity.Property(e => e.EmbeddingId).HasColumnName("embedding_id").HasMaxLength(100);
            entity.Property(e => e.ChunkIndex).HasColumnName("chunk_index");
            entity.Property(e => e.Metadata).HasColumnName("metadata").HasColumnType("jsonb");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasOne(e => e.Species)
                  .WithMany()
                  .HasForeignKey(e => e.SpeciesId);
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.ToTable("chat_sessions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.ContextTopic).HasColumnName("context_topic").HasMaxLength(100);
            entity.Property(e => e.StartedAt).HasColumnName("started_at");
            entity.HasIndex(e => e.UserId); // Logical FK to SQL Server
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("chat_messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SessionId).HasColumnName("session_id");
            entity.Property(e => e.Role).HasColumnName("role").HasMaxLength(20);
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.HasOne(e => e.Session)
                  .WithMany(s => s.Messages)
                  .HasForeignKey(e => e.SessionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
