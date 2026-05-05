using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.Extensions.Logging;
using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Bio.Backend.Core.Bio.Infrastructure.Persistence;

namespace Bio.Infrastructure.Services;

public class SpeciesImportJob : ISpeciesBulkImportJob
{
    private readonly ILogger<SpeciesImportJob> _logger;
    private readonly ISpeciesRepository _speciesRepository;
    private readonly ITaxonomyRepository _taxonomyRepository;
    private readonly IScientificUnitOfWork _unitOfWork;
    private readonly ScientificDbContext _dbContext;

    public SpeciesImportJob(
        ILogger<SpeciesImportJob> logger,
        ISpeciesRepository speciesRepository,
        ITaxonomyRepository taxonomyRepository,
        IScientificUnitOfWork unitOfWork,
        ScientificDbContext dbContext)
    {
        _logger = logger;
        _speciesRepository = speciesRepository;
        _taxonomyRepository = taxonomyRepository;
        _unitOfWork = unitOfWork;
        _dbContext = dbContext;
    }

    // =====================================================================
    // CSV IMPORT — Carga masiva de especies desde archivo CSV
    // =====================================================================

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
                    var (processed, skipped) = await ProcessCsvBatchAsync(currentBatch, userId);
                    totalProcessed += processed;
                    totalSkipped += skipped;
                    currentBatch.Clear();

                    // Clear EF change tracker to prevent memory/performance degradation
                    _dbContext.ChangeTracker.Clear();
                }
            }

            if (currentBatch.Count > 0)
            {
                var (processed, skipped) = await ProcessCsvBatchAsync(currentBatch, userId);
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
            throw;
        }
        finally
        {
            if (File.Exists(filePath))
                File.Delete(filePath);
        }
    }

    internal async Task<(int Processed, int Skipped)> ProcessCsvBatchAsync(List<SpeciesCsvRecord> batch, Guid userId)
    {
        _logger.LogInformation("Processing CSV batch of {Count} records", batch.Count);

        // 1. Pre-filter records with empty ScientificName
        var validRecords = new List<SpeciesCsvRecord>();
        int skipped = 0;

        foreach (var record in batch)
        {
            if (string.IsNullOrWhiteSpace(record.ScientificName))
            {
                _logger.LogWarning("Skipping record with empty ScientificName.");
                skipped++;
            }
            else
            {
                validRecords.Add(record);
            }
        }

        if (validRecords.Count == 0)
            return (0, skipped);

        // 2. Bulk duplicate check — single DB query instead of N queries
        var allNames = validRecords.Select(r => r.ScientificName.Trim()).Distinct().ToList();
        var existingNames = await _speciesRepository.ExistingScientificNamesAsync(allNames);

        var newRecords = new List<SpeciesCsvRecord>();
        foreach (var record in validRecords)
        {
            if (existingNames.Contains(record.ScientificName.Trim()))
            {
                _logger.LogWarning("Skipping duplicate species: {ScientificName}", record.ScientificName);
                skipped++;
            }
            else
            {
                newRecords.Add(record);
            }
        }

        if (newRecords.Count == 0)
            return (0, skipped);

        // 3. Process taxonomies with in-memory cache
        var taxonomyCache = new Dictionary<string, Taxonomy>();
        var speciesEntities = new List<Species>();

        foreach (var record in newRecords)
        {
            var taxonomyKey = BuildTaxonomyKey(record);

            if (!taxonomyCache.TryGetValue(taxonomyKey, out var taxonomy))
            {
                taxonomy = await _taxonomyRepository.GetByFieldsAsync(
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
                    await _unitOfWork.SaveChangesAsync();
                }

                taxonomyCache[taxonomyKey] = taxonomy;
            }

            var slug = GenerateSlug(record.ScientificName);

            var species = new Species(
                id: Guid.NewGuid(),
                slug: slug,
                scientificName: record.ScientificName.Trim(),
                taxonomyId: taxonomy.Id,
                thumbnailUrl: NullIfEmpty(record.ThumbnailUrl),
                commonName: NullIfEmpty(record.CommonName),
                description: NullIfEmpty(record.Description),
                ecologicalInfo: NullIfEmpty(record.EcologicalInfo),
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
            "CSV batch complete. Inserted: {Inserted}, Skipped: {Skipped}",
            speciesEntities.Count, skipped);

        return (speciesEntities.Count, skipped);
    }

    // =====================================================================
    // ECONOMIC POTENTIAL — JSON bulk update → table species_economic_potentials
    // =====================================================================

    /// <summary>
    /// Lee el archivo JSON con la estructura de species_economic_potential.json,
    /// busca cada especie por scientific_name y reemplaza sus registros en
    /// la tabla species_economic_potentials (delete + insert idempotente).
    ///
    /// Estructura del JSON:
    /// [{ "scientific_name": "...", "economic_potential": [...], "confidence": "..." }]
    ///
    /// Cada elemento del array "economic_potential":
    /// { "sector": "...", "products": [...], "active_properties": [...], "description": "...",
    ///   "market_value": "...", "sustainability_level": "..." }
    /// </summary>
    public async Task ProcessEconomicPotentialImportAsync(string filePath, Guid userId)
    {
        _logger.LogInformation(
            "Starting Economic Potential bulk import from {FilePath} by User {UserId}", filePath, userId);

        if (!File.Exists(filePath))
        {
            _logger.LogError("File not found at {FilePath}", filePath);
            return;
        }

        try
        {
            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true,
            };

            await using var stream = File.OpenRead(filePath);
            var rawRecords = await JsonSerializer.DeserializeAsync<List<JsonElement>>(stream, jsonOptions)
                ?? new List<JsonElement>();

            int totalUpdated = 0;
            int totalSkipped = 0;

            const int batchSize = 500;
            for (int offset = 0; offset < rawRecords.Count; offset += batchSize)
            {
                var batch = rawRecords.Skip(offset).Take(batchSize).ToList();
                var (updated, skipped) = await ProcessEconomicPotentialBatchAsync(batch, jsonOptions);
                totalUpdated += updated;
                totalSkipped += skipped;

                _dbContext.ChangeTracker.Clear();
            }

            _logger.LogInformation(
                "Economic Potential import complete. Updated: {Updated}, Skipped (not found): {Skipped}",
                totalUpdated, totalSkipped);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process economic potential file {FilePath}", filePath);
            throw;
        }
        finally
        {
            if (File.Exists(filePath))
                File.Delete(filePath);
        }
    }

    internal async Task<(int Updated, int Skipped)> ProcessEconomicPotentialBatchAsync(
        List<JsonElement> batch, JsonSerializerOptions options)
    {
        int updated = 0;
        int skipped = 0;

        // Pre-resolve names for bulk lookup
        var names = ExtractScientificNames(batch);
        var existingNames = await _speciesRepository.ExistingScientificNamesAsync(names);

        foreach (var element in batch)
        {
            var scientificName = GetScientificName(element);
            if (scientificName == null)
            {
                skipped++;
                continue;
            }

            if (!existingNames.Contains(scientificName))
            {
                _logger.LogDebug("Economic potential: '{Name}' not found in DB — skipped.", scientificName);
                skipped++;
                continue;
            }

            if (!element.TryGetProperty("economic_potential", out var potentialArrayEl)
                || potentialArrayEl.ValueKind != JsonValueKind.Array)
            {
                _logger.LogDebug("Economic potential: '{Name}' has no economic_potential array — skipped.", scientificName);
                skipped++;
                continue;
            }

            var confidence = element.TryGetProperty("confidence", out var confEl)
                ? confEl.GetString() ?? "medium"
                : "medium";

            var species = await _speciesRepository.GetByScientificNameAsync(scientificName);
            if (species == null)
            {
                skipped++;
                continue;
            }

            var potentials = new List<SpeciesEconomicPotential>();

            foreach (var item in potentialArrayEl.EnumerateArray())
            {
                var sector = item.TryGetProperty("sector", out var sEl) ? sEl.GetString()?.Trim() : null;
                if (string.IsNullOrWhiteSpace(sector)) continue;

                var products = ExtractStringArray(item, "products");
                var activeProperties = ExtractStringArray(item, "active_properties");
                var description = item.TryGetProperty("description", out var dEl) ? dEl.GetString() : null;
                var marketValue = item.TryGetProperty("market_value", out var mvEl) ? mvEl.GetString() ?? "" : "";
                var sustainabilityLevel = item.TryGetProperty("sustainability_level", out var slEl) ? slEl.GetString() ?? "" : "";

                potentials.Add(new SpeciesEconomicPotential(
                    speciesId: species.Id,
                    sector: sector,
                    products: products,
                    activeProperties: activeProperties.Length > 0 ? activeProperties : null,
                    description: description,
                    marketValue: marketValue,
                    sustainabilityLevel: sustainabilityLevel,
                    confidence: confidence));
            }

            await _speciesRepository.BulkReplaceEconomicPotentialsAsync(species.Id, potentials);
            await _unitOfWork.SaveChangesAsync();

            updated++;
        }

        _logger.LogInformation(
            "Economic potential batch complete. Updated: {Updated}, Skipped: {Skipped}", updated, skipped);

        return (updated, skipped);
    }

    // =====================================================================
    // TRADITIONAL USES — JSON bulk update → table species_traditional_uses
    // =====================================================================

    /// <summary>
    /// Lee el archivo JSON con la estructura de species_traditional_uses.json,
    /// busca cada especie por scientific_name y reemplaza sus registros en
    /// la tabla species_traditional_uses (delete + insert idempotente).
    ///
    /// Estructura del JSON:
    /// [{ "scientific_name": "...", "traditional_uses": [...], "confidence": "..." }]
    ///
    /// Cada elemento del array "traditional_uses":
    /// { "part": "...", "category": [...], "specific_purpose": "...",
    ///   "preparation_method": "...", "description": "...",
    ///   "community": "...", "traditional_warnings": "..." }
    /// </summary>
    public async Task ProcessTraditionalUsesImportAsync(string filePath, Guid userId)
    {
        _logger.LogInformation(
            "Starting Traditional Uses bulk import from {FilePath} by User {UserId}", filePath, userId);

        if (!File.Exists(filePath))
        {
            _logger.LogError("File not found at {FilePath}", filePath);
            return;
        }

        try
        {
            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true,
            };

            await using var stream = File.OpenRead(filePath);
            var rawRecords = await JsonSerializer.DeserializeAsync<List<JsonElement>>(stream, jsonOptions)
                ?? new List<JsonElement>();

            int totalUpdated = 0;
            int totalSkipped = 0;

            const int batchSize = 500;
            for (int offset = 0; offset < rawRecords.Count; offset += batchSize)
            {
                var batch = rawRecords.Skip(offset).Take(batchSize).ToList();
                var (updated, skipped) = await ProcessTraditionalUsesBatchAsync(batch, jsonOptions);
                totalUpdated += updated;
                totalSkipped += skipped;

                _dbContext.ChangeTracker.Clear();
            }

            _logger.LogInformation(
                "Traditional Uses import complete. Updated: {Updated}, Skipped (not found): {Skipped}",
                totalUpdated, totalSkipped);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process traditional uses file {FilePath}", filePath);
            throw;
        }
        finally
        {
            if (File.Exists(filePath))
                File.Delete(filePath);
        }
    }

    internal async Task<(int Updated, int Skipped)> ProcessTraditionalUsesBatchAsync(
        List<JsonElement> batch, JsonSerializerOptions options)
    {
        int updated = 0;
        int skipped = 0;

        var names = ExtractScientificNames(batch);
        var existingNames = await _speciesRepository.ExistingScientificNamesAsync(names);

        foreach (var element in batch)
        {
            var scientificName = GetScientificName(element);
            if (scientificName == null)
            {
                skipped++;
                continue;
            }

            if (!existingNames.Contains(scientificName))
            {
                _logger.LogDebug("Traditional uses: '{Name}' not found in DB — skipped.", scientificName);
                skipped++;
                continue;
            }

            if (!element.TryGetProperty("traditional_uses", out var usesArrayEl)
                || usesArrayEl.ValueKind != JsonValueKind.Array)
            {
                _logger.LogDebug("Traditional uses: '{Name}' has no traditional_uses array — skipped.", scientificName);
                skipped++;
                continue;
            }

            var confidence = element.TryGetProperty("confidence", out var confEl)
                ? confEl.GetString() ?? "medium"
                : "medium";

            var species = await _speciesRepository.GetByScientificNameAsync(scientificName);
            if (species == null)
            {
                skipped++;
                continue;
            }

            var uses = new List<SpeciesTraditionalUse>();

            foreach (var item in usesArrayEl.EnumerateArray())
            {
                var part = item.TryGetProperty("part", out var pEl) ? pEl.GetString()?.Trim() : null;
                if (string.IsNullOrWhiteSpace(part)) continue;

                var category = ExtractStringArray(item, "category");
                var specificPurpose = item.TryGetProperty("specific_purpose", out var spEl) ? spEl.GetString() : null;
                var preparationMethod = item.TryGetProperty("preparation_method", out var pmEl) ? pmEl.GetString() : null;
                var description = item.TryGetProperty("description", out var dEl) ? dEl.GetString() : null;
                var community = item.TryGetProperty("community", out var cEl) ? cEl.GetString() : null;
                var warnings = item.TryGetProperty("traditional_warnings", out var wEl) ? wEl.GetString() : null;

                uses.Add(new SpeciesTraditionalUse(
                    speciesId: species.Id,
                    part: part,
                    category: category,
                    specificPurpose: specificPurpose,
                    preparationMethod: preparationMethod,
                    description: description,
                    community: community,
                    traditionalWarnings: warnings,
                    confidence: confidence));
            }

            await _speciesRepository.BulkReplaceTraditionalUsesAsync(species.Id, uses);
            await _unitOfWork.SaveChangesAsync();

            updated++;
        }

        _logger.LogInformation(
            "Traditional uses batch complete. Updated: {Updated}, Skipped: {Skipped}", updated, skipped);

        return (updated, skipped);
    }

    // =====================================================================
    // HELPERS PRIVADOS
    // =====================================================================

    /// <summary>Builds a composite cache key from the taxonomy fields of a CSV record.</summary>
    internal static string BuildTaxonomyKey(SpeciesCsvRecord record)
    {
        return string.Join("|",
            record.Kingdom?.Trim() ?? "",
            record.Phylum?.Trim() ?? "",
            record.Class?.Trim() ?? "",
            record.Order?.Trim() ?? "",
            record.Family?.Trim() ?? "",
            record.Genus?.Trim() ?? "");
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
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? GetScientificName(JsonElement element)
    {
        if (!element.TryGetProperty("scientific_name", out var nameEl)) return null;
        var name = nameEl.GetString()?.Trim();
        return string.IsNullOrWhiteSpace(name) ? null : name;
    }

    private static List<string> ExtractScientificNames(List<JsonElement> batch)
        => batch
            .Where(e => e.TryGetProperty("scientific_name", out _))
            .Select(e => e.GetProperty("scientific_name").GetString()?.Trim() ?? string.Empty)
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    private static string[] ExtractStringArray(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var arrayEl)
            || arrayEl.ValueKind != JsonValueKind.Array)
            return Array.Empty<string>();

        return arrayEl.EnumerateArray()
            .Where(e => e.ValueKind == JsonValueKind.String)
            .Select(e => e.GetString() ?? string.Empty)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToArray();
    }
}
