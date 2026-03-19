using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bio.Infrastructure.Migrations.ScientificDb
{
    /// <inheritdoc />
    public partial class AlignSpeciesTaxonomyToScript : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GeographicDistributions_Species_SpeciesId",
                table: "GeographicDistributions");

            migrationBuilder.DropForeignKey(
                name: "FK_RagDocuments_Species_SpeciesId",
                table: "RagDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_Species_Taxonomies_TaxonomyId",
                table: "Species");

            migrationBuilder.DropForeignKey(
                name: "FK_SpeciesImages_Species_SpeciesId",
                table: "SpeciesImages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Species",
                table: "Species");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Taxonomies",
                table: "Taxonomies");

            migrationBuilder.DropPrimaryKey(
                name: "PK_GeographicDistributions",
                table: "GeographicDistributions");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Taxonomies");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "Taxonomies");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Taxonomies");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "GeographicDistributions");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "GeographicDistributions");

            migrationBuilder.DropColumn(
                name: "ObservationDate",
                table: "GeographicDistributions");

            migrationBuilder.DropColumn(
                name: "ObserverUserId",
                table: "GeographicDistributions");

            migrationBuilder.DropColumn(
                name: "Vereda",
                table: "GeographicDistributions");

            migrationBuilder.RenameTable(
                name: "Species",
                newName: "species");

            migrationBuilder.RenameTable(
                name: "Taxonomies",
                newName: "taxonomy");

            migrationBuilder.RenameTable(
                name: "GeographicDistributions",
                newName: "geographic_distribution");

            migrationBuilder.RenameColumn(
                name: "Slug",
                table: "species",
                newName: "slug");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "species",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "species",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "species",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "TraditionalUses",
                table: "species",
                newName: "traditional_uses");

            migrationBuilder.RenameColumn(
                name: "ThumbnailUrl",
                table: "species",
                newName: "thumbnail_url");

            migrationBuilder.RenameColumn(
                name: "TaxonomyId",
                table: "species",
                newName: "taxonomy_id");

            migrationBuilder.RenameColumn(
                name: "ScientificName",
                table: "species",
                newName: "scientific_name");

            migrationBuilder.RenameColumn(
                name: "IsSensitive",
                table: "species",
                newName: "is_sensitive");

            migrationBuilder.RenameColumn(
                name: "EconomicPotential",
                table: "species",
                newName: "economic_potential");

            migrationBuilder.RenameColumn(
                name: "EcologicalInfo",
                table: "species",
                newName: "ecological_info");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "species",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "ConservationStatus",
                table: "species",
                newName: "conservation_status");

            migrationBuilder.RenameColumn(
                name: "CommonName",
                table: "species",
                newName: "common_name");

            migrationBuilder.RenameIndex(
                name: "IX_Species_TaxonomyId",
                table: "species",
                newName: "IX_species_taxonomy_id");

            migrationBuilder.RenameIndex(
                name: "IX_Species_ScientificName",
                table: "species",
                newName: "IX_species_scientific_name");

            migrationBuilder.RenameColumn(
                name: "Phylum",
                table: "taxonomy",
                newName: "phylum");

            migrationBuilder.RenameColumn(
                name: "Kingdom",
                table: "taxonomy",
                newName: "kingdom");

            migrationBuilder.RenameColumn(
                name: "Genus",
                table: "taxonomy",
                newName: "genus");

            migrationBuilder.RenameColumn(
                name: "Family",
                table: "taxonomy",
                newName: "family");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "taxonomy",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "ClassName",
                table: "taxonomy",
                newName: "class_name");

            migrationBuilder.RenameIndex(
                name: "IX_Taxonomies_Genus",
                table: "taxonomy",
                newName: "IX_taxonomy_genus");

            migrationBuilder.RenameIndex(
                name: "IX_Taxonomies_Family",
                table: "taxonomy",
                newName: "IX_taxonomy_family");

            migrationBuilder.RenameColumn(
                name: "Municipality",
                table: "geographic_distribution",
                newName: "municipality");

            migrationBuilder.RenameColumn(
                name: "Altitude",
                table: "geographic_distribution",
                newName: "altitude");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "geographic_distribution",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "SpeciesId",
                table: "geographic_distribution",
                newName: "species_id");

            migrationBuilder.RenameColumn(
                name: "LocationPoint",
                table: "geographic_distribution",
                newName: "location_point");

            migrationBuilder.RenameIndex(
                name: "IX_GeographicDistributions_SpeciesId",
                table: "geographic_distribution",
                newName: "IX_geographic_distribution_species_id");

            migrationBuilder.AlterColumn<string>(
                name: "slug",
                table: "species",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "species",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "thumbnail_url",
                table: "species",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "scientific_name",
                table: "species",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "economic_potential",
                table: "species",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "conservation_status",
                table: "species",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "common_name",
                table: "species",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "phylum",
                table: "taxonomy",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "kingdom",
                table: "taxonomy",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "genus",
                table: "taxonomy",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "family",
                table: "taxonomy",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "class_name",
                table: "taxonomy",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "order_name",
                table: "taxonomy",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "municipality",
                table: "geographic_distribution",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "ecosystem_type",
                table: "geographic_distribution",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "latitude",
                table: "geographic_distribution",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "longitude",
                table: "geographic_distribution",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_species",
                table: "species",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_taxonomy",
                table: "taxonomy",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_geographic_distribution",
                table: "geographic_distribution",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "IX_species_slug",
                table: "species",
                column: "slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_geographic_distribution_species_species_id",
                table: "geographic_distribution",
                column: "species_id",
                principalTable: "species",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RagDocuments_species_SpeciesId",
                table: "RagDocuments",
                column: "SpeciesId",
                principalTable: "species",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_species_taxonomy_taxonomy_id",
                table: "species",
                column: "taxonomy_id",
                principalTable: "taxonomy",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_SpeciesImages_species_SpeciesId",
                table: "SpeciesImages",
                column: "SpeciesId",
                principalTable: "species",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_geographic_distribution_species_species_id",
                table: "geographic_distribution");

            migrationBuilder.DropForeignKey(
                name: "FK_RagDocuments_species_SpeciesId",
                table: "RagDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_species_taxonomy_taxonomy_id",
                table: "species");

            migrationBuilder.DropForeignKey(
                name: "FK_SpeciesImages_species_SpeciesId",
                table: "SpeciesImages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_species",
                table: "species");

            migrationBuilder.DropIndex(
                name: "IX_species_slug",
                table: "species");

            migrationBuilder.DropPrimaryKey(
                name: "PK_taxonomy",
                table: "taxonomy");

            migrationBuilder.DropPrimaryKey(
                name: "PK_geographic_distribution",
                table: "geographic_distribution");

            migrationBuilder.DropColumn(
                name: "order_name",
                table: "taxonomy");

            migrationBuilder.DropColumn(
                name: "ecosystem_type",
                table: "geographic_distribution");

            migrationBuilder.DropColumn(
                name: "latitude",
                table: "geographic_distribution");

            migrationBuilder.DropColumn(
                name: "longitude",
                table: "geographic_distribution");

            migrationBuilder.RenameTable(
                name: "species",
                newName: "Species");

            migrationBuilder.RenameTable(
                name: "taxonomy",
                newName: "Taxonomies");

            migrationBuilder.RenameTable(
                name: "geographic_distribution",
                newName: "GeographicDistributions");

            migrationBuilder.RenameColumn(
                name: "slug",
                table: "Species",
                newName: "Slug");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Species",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Species",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Species",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "traditional_uses",
                table: "Species",
                newName: "TraditionalUses");

            migrationBuilder.RenameColumn(
                name: "thumbnail_url",
                table: "Species",
                newName: "ThumbnailUrl");

            migrationBuilder.RenameColumn(
                name: "taxonomy_id",
                table: "Species",
                newName: "TaxonomyId");

            migrationBuilder.RenameColumn(
                name: "scientific_name",
                table: "Species",
                newName: "ScientificName");

            migrationBuilder.RenameColumn(
                name: "is_sensitive",
                table: "Species",
                newName: "IsSensitive");

            migrationBuilder.RenameColumn(
                name: "economic_potential",
                table: "Species",
                newName: "EconomicPotential");

            migrationBuilder.RenameColumn(
                name: "ecological_info",
                table: "Species",
                newName: "EcologicalInfo");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Species",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "conservation_status",
                table: "Species",
                newName: "ConservationStatus");

            migrationBuilder.RenameColumn(
                name: "common_name",
                table: "Species",
                newName: "CommonName");

            migrationBuilder.RenameIndex(
                name: "IX_species_taxonomy_id",
                table: "Species",
                newName: "IX_Species_TaxonomyId");

            migrationBuilder.RenameIndex(
                name: "IX_species_scientific_name",
                table: "Species",
                newName: "IX_Species_ScientificName");

            migrationBuilder.RenameColumn(
                name: "phylum",
                table: "Taxonomies",
                newName: "Phylum");

            migrationBuilder.RenameColumn(
                name: "kingdom",
                table: "Taxonomies",
                newName: "Kingdom");

            migrationBuilder.RenameColumn(
                name: "genus",
                table: "Taxonomies",
                newName: "Genus");

            migrationBuilder.RenameColumn(
                name: "family",
                table: "Taxonomies",
                newName: "Family");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Taxonomies",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "class_name",
                table: "Taxonomies",
                newName: "ClassName");

            migrationBuilder.RenameIndex(
                name: "IX_taxonomy_genus",
                table: "Taxonomies",
                newName: "IX_Taxonomies_Genus");

            migrationBuilder.RenameIndex(
                name: "IX_taxonomy_family",
                table: "Taxonomies",
                newName: "IX_Taxonomies_Family");

            migrationBuilder.RenameColumn(
                name: "municipality",
                table: "GeographicDistributions",
                newName: "Municipality");

            migrationBuilder.RenameColumn(
                name: "altitude",
                table: "GeographicDistributions",
                newName: "Altitude");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "GeographicDistributions",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "species_id",
                table: "GeographicDistributions",
                newName: "SpeciesId");

            migrationBuilder.RenameColumn(
                name: "location_point",
                table: "GeographicDistributions",
                newName: "LocationPoint");

            migrationBuilder.RenameIndex(
                name: "IX_geographic_distribution_species_id",
                table: "GeographicDistributions",
                newName: "IX_GeographicDistributions_SpeciesId");

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "Species",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Species",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "ThumbnailUrl",
                table: "Species",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ScientificName",
                table: "Species",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "EconomicPotential",
                table: "Species",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ConservationStatus",
                table: "Species",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CommonName",
                table: "Species",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Phylum",
                table: "Taxonomies",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Kingdom",
                table: "Taxonomies",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Genus",
                table: "Taxonomies",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Family",
                table: "Taxonomies",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ClassName",
                table: "Taxonomies",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Taxonomies",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Order",
                table: "Taxonomies",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Taxonomies",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "Municipality",
                table: "GeographicDistributions",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "GeographicDistributions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "GeographicDistributions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ObservationDate",
                table: "GeographicDistributions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ObserverUserId",
                table: "GeographicDistributions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Vereda",
                table: "GeographicDistributions",
                type: "text",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Species",
                table: "Species",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Taxonomies",
                table: "Taxonomies",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_GeographicDistributions",
                table: "GeographicDistributions",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_GeographicDistributions_Species_SpeciesId",
                table: "GeographicDistributions",
                column: "SpeciesId",
                principalTable: "Species",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RagDocuments_Species_SpeciesId",
                table: "RagDocuments",
                column: "SpeciesId",
                principalTable: "Species",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Species_Taxonomies_TaxonomyId",
                table: "Species",
                column: "TaxonomyId",
                principalTable: "Taxonomies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SpeciesImages_Species_SpeciesId",
                table: "SpeciesImages",
                column: "SpeciesId",
                principalTable: "Species",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
