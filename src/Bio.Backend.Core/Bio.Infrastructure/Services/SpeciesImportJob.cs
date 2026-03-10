using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Threading.Tasks;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.Extensions.Logging;
using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
// using Bio.Domain.Entities;

namespace Bio.Infrastructure.Services;

public class SpeciesImportJob : ISpeciesBulkImportJob
{
    private readonly ILogger<SpeciesImportJob> _logger;
    // private readonly ISpeciesRepository _speciesRepository; // Placeholder (Domain CRUD missing)
    // private readonly ITaxonomyRepository _taxonomyRepository; // Placeholder (Domain CRUD missing)

    public SpeciesImportJob(ILogger<SpeciesImportJob> logger)
    {
        _logger = logger;
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

            await foreach (var record in records)
            {
                currentBatch.Add(record);

                if (currentBatch.Count >= batchSize)
                {
                    await ProcessBatchAsync(currentBatch, userId);
                    totalProcessed += currentBatch.Count;
                    currentBatch.Clear();
                }
            }

            if (currentBatch.Count > 0)
            {
                await ProcessBatchAsync(currentBatch, userId);
                totalProcessed += currentBatch.Count;
            }

            _logger.LogInformation("Successfully processed {TotalProcessed} records from CSV", totalProcessed);
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

    private async Task ProcessBatchAsync(List<SpeciesCsvRecord> batch, Guid userId)
    {
        _logger.LogInformation("Processing batch of {Count} records", batch.Count);

        // TODO: Mapear SpeciesCsvRecord a entidades del Dominio (Taxonomy, Species, GeographicDistribution)
        // Ejemplo:
        // foreach(var record in batch) {
        //     var taxonomy = new Taxonomy(record.Kingdom, record.Family, ...);
        //     var species = new Species(record.ScientificName, ...);
        //     species.GeographicDistributions.Add(new GeographicDistribution(record.Latitude, ...));
        // }

        // TODO: Invocar _speciesRepository.AddRangeAsync(entities) para insertar las entidades
        // await _speciesRepository.SaveChangesAsync();

        // Para evitar bloqueos, simulamos I/O:
        await Task.Delay(100); 
    }
}
