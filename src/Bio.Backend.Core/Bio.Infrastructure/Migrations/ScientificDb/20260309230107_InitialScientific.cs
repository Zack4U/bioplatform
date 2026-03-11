using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Bio.Infrastructure.Migrations.ScientificDb
{
    /// <inheritdoc />
    public partial class InitialScientific : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.CreateTable(
                name: "BusinessPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EntrepreneurId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectTitle = table.Column<string>(type: "text", nullable: false),
                    SpeciesIds = table.Column<Guid[]>(type: "uuid[]", nullable: false),
                    GeneratedContent = table.Column<string>(type: "text", nullable: false),
                    MarketAnalysisData = table.Column<string>(type: "text", nullable: true),
                    FinancialProjections = table.Column<string>(type: "text", nullable: true),
                    GenerationPrompt = table.Column<string>(type: "text", nullable: true),
                    ModelUsed = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PredictionLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ImageInputUrl = table.Column<string>(type: "text", nullable: false),
                    RawPredictionResult = table.Column<string>(type: "text", nullable: false),
                    TopPredictionSpeciesId = table.Column<Guid>(type: "uuid", nullable: true),
                    ConfidenceScore = table.Column<decimal>(type: "numeric", nullable: false),
                    FeedbackCorrect = table.Column<bool>(type: "boolean", nullable: true),
                    FeedbackActualSpeciesId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProcessingTimeMs = table.Column<int>(type: "integer", nullable: true),
                    ModelVersion = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PredictionLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Taxonomies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Kingdom = table.Column<string>(type: "text", nullable: false),
                    Phylum = table.Column<string>(type: "text", nullable: true),
                    ClassName = table.Column<string>(type: "text", nullable: true),
                    Order = table.Column<string>(type: "text", nullable: true),
                    Family = table.Column<string>(type: "text", nullable: true),
                    Genus = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Taxonomies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Species",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TaxonomyId = table.Column<int>(type: "integer", nullable: true),
                    ScientificName = table.Column<string>(type: "text", nullable: false),
                    CommonName = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    EcologicalInfo = table.Column<string>(type: "text", nullable: true),
                    TraditionalUses = table.Column<string>(type: "text", nullable: true),
                    EconomicPotential = table.Column<string>(type: "text", nullable: true),
                    ConservationStatus = table.Column<string>(type: "text", nullable: true),
                    IsSensitive = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Species", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Species_Taxonomies_TaxonomyId",
                        column: x => x.TaxonomyId,
                        principalTable: "Taxonomies",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GeographicDistributions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SpeciesId = table.Column<Guid>(type: "uuid", nullable: false),
                    Municipality = table.Column<string>(type: "text", nullable: false),
                    Vereda = table.Column<string>(type: "text", nullable: true),
                    LocationPoint = table.Column<Point>(type: "geometry", nullable: true),
                    Altitude = table.Column<double>(type: "double precision", nullable: true),
                    ObservationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ObserverUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GeographicDistributions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GeographicDistributions_Species_SpeciesId",
                        column: x => x.SpeciesId,
                        principalTable: "Species",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RagDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    SourceType = table.Column<string>(type: "text", nullable: true),
                    SourceUrl = table.Column<string>(type: "text", nullable: true),
                    SpeciesId = table.Column<Guid>(type: "uuid", nullable: true),
                    EmbeddingId = table.Column<string>(type: "text", nullable: true),
                    ChunkIndex = table.Column<int>(type: "integer", nullable: false),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RagDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RagDocuments_Species_SpeciesId",
                        column: x => x.SpeciesId,
                        principalTable: "Species",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SpeciesImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SpeciesId = table.Column<Guid>(type: "uuid", nullable: false),
                    UploaderUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "text", nullable: true),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    IsValidatedByExpert = table.Column<bool>(type: "boolean", nullable: false),
                    ValidatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ValidationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LicenseType = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpeciesImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SpeciesImages_Species_SpeciesId",
                        column: x => x.SpeciesId,
                        principalTable: "Species",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessPlans_EntrepreneurId",
                table: "BusinessPlans",
                column: "EntrepreneurId");

            migrationBuilder.CreateIndex(
                name: "IX_GeographicDistributions_SpeciesId",
                table: "GeographicDistributions",
                column: "SpeciesId");

            migrationBuilder.CreateIndex(
                name: "IX_RagDocuments_SpeciesId",
                table: "RagDocuments",
                column: "SpeciesId");

            migrationBuilder.CreateIndex(
                name: "IX_Species_ScientificName",
                table: "Species",
                column: "ScientificName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Species_TaxonomyId",
                table: "Species",
                column: "TaxonomyId");

            migrationBuilder.CreateIndex(
                name: "IX_SpeciesImages_SpeciesId",
                table: "SpeciesImages",
                column: "SpeciesId");

            migrationBuilder.CreateIndex(
                name: "IX_Taxonomies_Family",
                table: "Taxonomies",
                column: "Family");

            migrationBuilder.CreateIndex(
                name: "IX_Taxonomies_Genus",
                table: "Taxonomies",
                column: "Genus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessPlans");

            migrationBuilder.DropTable(
                name: "GeographicDistributions");

            migrationBuilder.DropTable(
                name: "PredictionLogs");

            migrationBuilder.DropTable(
                name: "RagDocuments");

            migrationBuilder.DropTable(
                name: "SpeciesImages");

            migrationBuilder.DropTable(
                name: "Species");

            migrationBuilder.DropTable(
                name: "Taxonomies");
        }
    }
}
