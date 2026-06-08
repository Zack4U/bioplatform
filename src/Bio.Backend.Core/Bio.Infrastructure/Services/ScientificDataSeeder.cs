using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Bio.Application.Common.Interfaces;
using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NetTopologySuite.Geometries;

namespace Bio.Infrastructure.Services;

/// <summary>
/// Seeds the PostgreSQL scientific catalog from the repository data files and generates mock
/// geographic distributions. Idempotent: species/distributions are only created when missing.
/// </summary>
public class ScientificDataSeeder : IScientificDataSeeder
{
    // Files expected inside the configured data directory.
    private const string SpeciesCsvFile = "species_import_llm.csv";
    private const string EconomicJsonFile = "species_economic_potential.json";
    private const string TraditionalJsonFile = "species_traditional_uses.json";
    private const string SpeciesImagesSqlFile = "insert_species_images.sql";
    // Lives in data/weights (sibling of the species_catalog dir), not in the data dir itself.
    private const string AiMetadataSqlFile = "seed_ai_metadata.sql";

    // System actor for seed-time imports (the import job only uses this for logging).
    private static readonly Guid SystemUserId = Guid.Parse("A1111111-1111-1111-1111-111111111111");

    // Number of geographic distribution points generated per species.
    private const int DistributionsPerSpecies = 10;

    private readonly ILogger<ScientificDataSeeder> _logger;
    private readonly IConfiguration _configuration;
    private readonly ISpeciesBulkImportJob _importJob;
    private readonly ISpeciesRepository _speciesRepository;
    private readonly ScientificDbContext _dbContext;

    public ScientificDataSeeder(
        ILogger<ScientificDataSeeder> logger,
        IConfiguration configuration,
        ISpeciesBulkImportJob importJob,
        ISpeciesRepository speciesRepository,
        ScientificDbContext dbContext)
    {
        _logger = logger;
        _configuration = configuration;
        _importJob = importJob;
        _speciesRepository = speciesRepository;
        _dbContext = dbContext;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var dataDir = ResolveDataDirectory();
        if (dataDir is null)
        {
            _logger.LogWarning(
                "Scientific data directory not found. Set SeedSettings:ScientificDataPath. Skipping scientific seed.");
            return;
        }

        _logger.LogInformation("Scientific seeding started. Data directory: {DataDir}", dataDir);

        // ── 1. Species (CSV) — only when the catalog is empty ────────────────
        var existing = await _speciesRepository.GetAllAsync(skip: 0, take: 1, cancellationToken);
        if (existing.Any())
        {
            _logger.LogInformation("Species catalog already populated — skipping CSV/economic/traditional import.");
        }
        else
        {
            await ImportIfPresentAsync(dataDir, SpeciesCsvFile,
                f => _importJob.ProcessCsvImportAsync(f, SystemUserId, deleteSourceFile: false));

            await ImportIfPresentAsync(dataDir, EconomicJsonFile,
                f => _importJob.ProcessEconomicPotentialImportAsync(f, SystemUserId, deleteSourceFile: false));

            await ImportIfPresentAsync(dataDir, TraditionalJsonFile,
                f => _importJob.ProcessTraditionalUsesImportAsync(f, SystemUserId, deleteSourceFile: false));
        }

        // ── 2. Species images gallery (raw SQL, keyed by scientific_name) ────
        await SeedSpeciesImagesAsync(dataDir, cancellationToken);

        // ── 3. AI model registry — first active model version + training jobs ─
        await SeedAiModelMetadataAsync(dataDir, cancellationToken);

        // ── 4. Geographic distributions — only when none exist ───────────────
        await SeedDistributionsAsync(cancellationToken);

        _logger.LogInformation("Scientific seeding finished.");
    }

    private async Task ImportIfPresentAsync(string dataDir, string fileName, Func<string, Task> import)
    {
        var path = Path.Combine(dataDir, fileName);
        if (!File.Exists(path))
        {
            _logger.LogWarning("Seed file not found: {Path} — skipped.", path);
            return;
        }

        _logger.LogInformation("Importing {File} ...", fileName);
        await import(path);
    }

    // =====================================================================
    // SPECIES IMAGES — gallery from insert_species_images.sql (by scientific_name)
    // =====================================================================

    private async Task SeedSpeciesImagesAsync(string dataDir, CancellationToken ct)
    {
        if (await _dbContext.SpeciesImages.AnyAsync(ct))
        {
            _logger.LogInformation("Species images already present — skipping image gallery seed.");
            return;
        }

        var path = Path.Combine(dataDir, SpeciesImagesSqlFile);
        if (!File.Exists(path))
        {
            _logger.LogWarning("Seed file not found: {Path} — skipped image gallery.", path);
            return;
        }

        // The script is a batch of INSERT/UPDATE statements keyed by scientific_name, so it works
        // regardless of the (deterministic) species ids. Npgsql runs multi-statement SQL in one call.
        var sql = await File.ReadAllTextAsync(path, ct);
        if (string.IsNullOrWhiteSpace(sql))
        {
            _logger.LogWarning("Image gallery SQL file is empty — skipped.");
            return;
        }

        _logger.LogInformation("Importing species image gallery from {File} ...", SpeciesImagesSqlFile);
        var affected = await _dbContext.Database.ExecuteSqlRawAsync(sql, ct);
        _logger.LogInformation("Species image gallery import affected {Rows} rows.", affected);
    }

    // =====================================================================
    // AI MODEL REGISTRY — first active model version + mock training jobs
    // =====================================================================

    private async Task SeedAiModelMetadataAsync(string dataDir, CancellationToken ct)
    {
        if (await _dbContext.AiModelVersions.AnyAsync(ct))
        {
            _logger.LogInformation("AI model registry already seeded — skipping.");
            return;
        }

        // seed_ai_metadata.sql lives in data/weights, a sibling of the species_catalog dir.
        var path = Path.GetFullPath(Path.Combine(dataDir, "..", "weights", AiMetadataSqlFile));
        if (!File.Exists(path))
        {
            _logger.LogWarning("Seed file not found: {Path} — skipped AI model registry.", path);
            return;
        }

        var sql = await File.ReadAllTextAsync(path, ct);
        if (string.IsNullOrWhiteSpace(sql))
        {
            _logger.LogWarning("AI metadata SQL file is empty — skipped.");
            return;
        }

        _logger.LogInformation("Seeding AI model registry from {File} ...", AiMetadataSqlFile);
        var affected = await _dbContext.Database.ExecuteSqlRawAsync(sql, ct);
        _logger.LogInformation("AI model registry seed affected {Rows} rows.", affected);
    }

    // =====================================================================
    // GEOGRAPHIC DISTRIBUTIONS — procedural mock points across Caldas
    // =====================================================================

    private async Task SeedDistributionsAsync(CancellationToken ct)
    {
        var alreadyHas = await _dbContext.GeographicDistributions.AnyAsync(ct);
        if (alreadyHas)
        {
            _logger.LogInformation("Geographic distributions already present — skipping generation.");
            return;
        }

        var species = (await _speciesRepository.GetAllAsync(skip: null, take: null, ct)).ToList();
        if (species.Count == 0)
        {
            _logger.LogWarning("No species found — cannot generate distributions.");
            return;
        }

        _logger.LogInformation(
            "Generating {PerSpecies} distributions for {Count} species ...",
            DistributionsPerSpecies, species.Count);

        int batch = 0;
        int total = 0;
        foreach (var sp in species)
        {
            foreach (var dist in GenerateForSpecies(sp.Id))
            {
                _dbContext.GeographicDistributions.Add(dist);
                total++;
                batch++;
            }

            if (batch >= 1000)
            {
                await _dbContext.SaveChangesAsync(ct);
                _dbContext.ChangeTracker.Clear();
                batch = 0;
            }
        }

        if (batch > 0)
        {
            await _dbContext.SaveChangesAsync(ct);
            _dbContext.ChangeTracker.Clear();
        }

        _logger.LogInformation("Generated {Total} geographic distribution points.", total);
    }

    /// <summary>
    /// Deterministically generates distribution points for a species near real Caldas municipalities.
    /// The RNG is seeded from the species id so re-running yields the same points.
    /// </summary>
    private static IEnumerable<GeographicDistribution> GenerateForSpecies(Guid speciesId)
    {
        // Stable seed derived from the (deterministic) species id.
        int seed = BitConverter.ToInt32(speciesId.ToByteArray(), 0);
        var rng = new Random(seed);

        for (int i = 0; i < DistributionsPerSpecies; i++)
        {
            var muni = CaldasMunicipalities[rng.Next(CaldasMunicipalities.Length)];

            // Jitter within roughly ±5.5 km so points scatter around the municipality center.
            double lat = Math.Round(muni.Lat + (rng.NextDouble() - 0.5) * 0.10, 6);
            double lon = Math.Round(muni.Lon + (rng.NextDouble() - 0.5) * 0.10, 6);
            double altitude = Math.Round(muni.BaseAltitude + (rng.NextDouble() - 0.5) * 400, 0);
            var ecosystem = EcosystemTypes[rng.Next(EcosystemTypes.Length)];

            var point = new Point(lon, lat) { SRID = 4326 }; // NTS Point is (X=lon, Y=lat)

            yield return new GeographicDistribution(
                speciesId: speciesId,
                latitude: lat,
                longitude: lon,
                altitude: altitude,
                municipality: muni.Name,
                ecosystemType: ecosystem,
                locationPoint: point);
        }
    }

    // Approximate centers of Caldas municipalities (WGS84) with a typical elevation (m.a.s.l).
    private static readonly (string Name, double Lat, double Lon, double BaseAltitude)[] CaldasMunicipalities =
    {
        ("Manizales",     5.0703, -75.5138, 2160),
        ("Villamaría",    5.0419, -75.5147, 1920),
        ("Chinchiná",     4.9826, -75.6056, 1378),
        ("Palestina",     5.0181, -75.6258, 1630),
        ("Neira",         5.1664, -75.5200, 1969),
        ("Aranzazu",      5.2719, -75.4906, 2090),
        ("Salamina",      5.4036, -75.4870, 1822),
        ("Aguadas",       5.6108, -75.4561, 2214),
        ("Pensilvania",   5.3833, -75.1611, 2050),
        ("Manzanares",    5.2553, -75.1531, 1920),
        ("Riosucio",      5.4222, -75.7036, 1783),
        ("Supía",         5.4519, -75.6500, 1183),
        ("Marmato",       5.4742, -75.5994, 1310),
        ("La Dorada",     5.4500, -74.6678, 178),
        ("Samaná",        5.4136, -74.9919, 1408),
        ("Anserma",       5.2419, -75.7836, 1796),
    };

    private static readonly string[] EcosystemTypes =
    {
        "Bosque andino",
        "Bosque de niebla",
        "Páramo",
        "Bosque seco tropical",
        "Zona riparia",
        "Borde de bosque",
        "Sistema agroforestal",
    };

    // =====================================================================
    // DATA DIRECTORY RESOLUTION
    // =====================================================================

    /// <summary>
    /// Resolves the scientific data directory from config (SeedSettings:ScientificDataPath), falling
    /// back to the AI catalog folder relative to the current working directory. Returns null if none exist.
    /// </summary>
    private string? ResolveDataDirectory()
    {
        var candidates = new List<string>();

        var configured = _configuration["SeedSettings:ScientificDataPath"];
        if (!string.IsNullOrWhiteSpace(configured))
            candidates.Add(configured);

        // Fallbacks relative to the API working directory (src/Bio.Backend.Core/Bio.API in dev).
        candidates.Add(Path.Combine("..", "..", "Bio.Backend.AI", "data", "species_catalog"));
        candidates.Add(Path.Combine(AppContext.BaseDirectory, "data", "species_catalog"));

        foreach (var c in candidates)
        {
            var full = Path.IsPathRooted(c) ? c : Path.GetFullPath(c);
            if (Directory.Exists(full))
                return full;
        }

        return null;
    }
}
