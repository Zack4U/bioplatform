using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.Extensions.Logging;
using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;

namespace Bio.Infrastructure.Services;

public class SpeciesImportJob : ISpeciesBulkImportJob
{
    private readonly ILogger<SpeciesImportJob> _logger;
    private readonly ISpeciesRepository _speciesRepository;
    private readonly ITaxonomyRepository _taxonomyRepository;
    private readonly IScientificUnitOfWork _unitOfWork;

    public SpeciesImportJob(
        ILogger<SpeciesImportJob> logger,
        ISpeciesRepository speciesRepository,
        ITaxonomyRepository taxonomyRepository,
        IScientificUnitOfWork unitOfWork)
    {
        _logger = logger;
        _speciesRepository = speciesRepository;
        _taxonomyRepository = taxonomyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task ProcessCsvImportAsync(string filePath, Guid userId)
    {
        _logger.LogInformation("Starting CSV Bulk Import from {FilePath} by User {UserId}", filePath, userId);

        if (!File.Exists(filePath))
        {
            _logger.LogError("File not found at {FilePath}", filePath);
            return;
        }

        try
        {
            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                MissingFieldFound = null,
                HeaderValidated = null
            };

            using var reader = new StreamReader(filePath);
            using var csv = new CsvReader(reader, config);

            var records = csv.GetRecordsAsync<SpeciesCsvRecord>();
            
            int batchSize = 500;
            var currentBatch = new List<SpeciesCsvRecord>();
            int totalProcessed = 0;
            int totalSkipped = 0;

            await foreach (var record in records)
            {
                currentBatch.Add(record);

                if (currentBatch.Count >= batchSize)
                {
                    var (processed, skipped) = await ProcessBatchAsync(currentBatch, userId);
                    totalProcessed += processed;
                    totalSkipped += skipped;
                    currentBatch.Clear();
                }
            }

            if (currentBatch.Count > 0)
            {
                var (processed, skipped) = await ProcessBatchAsync(currentBatch, userId);
                totalProcessed += processed;
                totalSkipped += skipped;
            }

            _logger.LogInformation(
                "CSV Import complete. Processed: {TotalProcessed}, Skipped (duplicates): {TotalSkipped}",
                totalProcessed, totalSkipped);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process CSV file {FilePath}", filePath);
            throw; // Rethrow to let Hangfire mark the job as Failed and apply retry logic
        }
        finally
        {
            // Clean up the temporary file after processing to save disk space
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
    }

    internal async Task<(int Processed, int Skipped)> ProcessBatchAsync(List<SpeciesCsvRecord> batch, Guid userId)
    {
        _logger.LogInformation("Processing batch of {Count} records", batch.Count);

        var speciesEntities = new List<Species>();
        int skipped = 0;

        foreach (var record in batch)
        {
            // Validate required field
            if (string.IsNullOrWhiteSpace(record.ScientificName))
            {
                _logger.LogWarning("Skipping record with empty ScientificName.");
                skipped++;
                continue;
            }

            // Check for duplicate by scientific name
            var existing = await _speciesRepository.GetByScientificNameAsync(record.ScientificName);
            if (existing != null)
            {
                _logger.LogWarning("Skipping duplicate species: {ScientificName}", record.ScientificName);
                skipped++;
                continue;
            }

            // Upsert Taxonomy: find existing or create new
            var taxonomy = await _taxonomyRepository.GetByFieldsAsync(
                NullIfEmpty(record.Kingdom),
                NullIfEmpty(record.Phylum),
                NullIfEmpty(record.Class),
                NullIfEmpty(record.Order),
                NullIfEmpty(record.Family),
                NullIfEmpty(record.Genus));

            if (taxonomy == null)
            {
                taxonomy = new Taxonomy(
                    NullIfEmpty(record.Kingdom),
                    NullIfEmpty(record.Phylum),
                    NullIfEmpty(record.Class),
                    NullIfEmpty(record.Order),
                    NullIfEmpty(record.Family),
                    NullIfEmpty(record.Genus));
                await _taxonomyRepository.AddAsync(taxonomy);
                // Save so the Taxonomy gets its generated Id
                await _unitOfWork.SaveChangesAsync();
            }

            // Generate slug from scientific name
            var slug = GenerateSlug(record.ScientificName);

            // Create Species entity
            var species = new Species(
                id: Guid.NewGuid(),
                slug: slug,
                scientificName: record.ScientificName.Trim(),
                taxonomyId: taxonomy.Id,
                thumbnailUrl: NullIfEmpty(record.ThumbnailUrl),
                commonName: NullIfEmpty(record.CommonName),
                description: NullIfEmpty(record.Description),
                ecologicalInfo: NullIfEmpty(record.EcologicalInfo),
                traditionalUses: NullIfEmpty(record.TraditionalUses),
                economicPotential: NullIfEmpty(record.EconomicPotential),
                conservationStatus: NullIfEmpty(record.ConservationStatus),
                altitudeRange: NullIfEmpty(record.AltitudeRange),
                legalStatus: record.LegalStatus,
                isSensitive: record.IsSensitive);

            speciesEntities.Add(species);
        }

        if (speciesEntities.Count > 0)
        {
            await _speciesRepository.AddRangeAsync(speciesEntities);
            await _unitOfWork.SaveChangesAsync();
        }

        _logger.LogInformation(
            "Batch complete. Inserted: {Inserted}, Skipped: {Skipped}",
            speciesEntities.Count, skipped);

        return (speciesEntities.Count, skipped);
    }

    /// <summary>
    /// Generates a URL-friendly slug from a scientific name.
    /// Example: "Cattleya trianae" → "cattleya-trianae"
    /// </summary>
    internal static string GenerateSlug(string scientificName)
    {
        var slug = scientificName.Trim().ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-");
        slug = slug.Trim('-');
        return slug;
    }

    private static string? NullIfEmpty(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
