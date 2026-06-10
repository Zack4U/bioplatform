using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Dashboard.Queries;

// =============================================================================
// RESEARCHER DASHBOARD
// =============================================================================

public record GetResearcherDashboardQuery(Guid ResearcherId) : IRequest<ResearcherDashboardDTO>;

public class GetResearcherDashboardQueryHandler : IRequestHandler<GetResearcherDashboardQuery, ResearcherDashboardDTO>
{
    private readonly ISpeciesRepository _speciesRepo;
    private readonly ISpeciesImageRepository _imageRepo;
    private readonly IGeographicDistributionRepository _geoRepo;
    private readonly IAbsPermitRepository _absRepo;

    public GetResearcherDashboardQueryHandler(
        ISpeciesRepository speciesRepo,
        ISpeciesImageRepository imageRepo,
        IGeographicDistributionRepository geoRepo,
        IAbsPermitRepository absRepo)
    {
        _speciesRepo = speciesRepo; _imageRepo = imageRepo;
        _geoRepo = geoRepo; _absRepo = absRepo;
    }

    public async Task<ResearcherDashboardDTO> Handle(GetResearcherDashboardQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var species = (await _speciesRepo.GetAllAsync(null, null, ct)).ToList();
        var images = (await _imageRepo.GetAllAsync(ct)).ToList();
        var geo = (await _geoRepo.GetAllAsync(ct)).ToList();
        var (permits, _) = await _absRepo.GetAllPagedAsync(null, "Active", 1, 10000, ct);

        // --- Species metrics ---
        var byConservation = species
            .Where(s => !string.IsNullOrWhiteSpace(s.ConservationStatus))
            .GroupBy(s => s.ConservationStatus!)
            .Select(g => new SpeciesConservationCountDTO(g.Key, g.Count()))
            .OrderByDescending(x => x.Count).ToList();

        var byKingdom = species
            .Where(s => s.Taxonomy != null && !string.IsNullOrWhiteSpace(s.Taxonomy.Kingdom))
            .GroupBy(s => s.Taxonomy!.Kingdom!)
            .Select(g => new SpeciesKingdomCountDTO(g.Key, g.Count()))
            .OrderByDescending(x => x.Count).ToList();

        var topFamilies = species
            .Where(s => s.Taxonomy != null && !string.IsNullOrWhiteSpace(s.Taxonomy.Family))
            .GroupBy(s => s.Taxonomy!.Family!)
            .Select(g => new SpeciesFamilyTopDTO(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .Take(10).ToList();

        // ABS: unique species with active permits
        var speciesWithPermits = permits.Select(p => p.SpeciesId).Distinct().Count();

        // --- Images ---
        var validated = images.Count(i => i.IsValidatedByExpert);
        var validatedByMe = images.Count(i => i.ValidatedByUserId == request.ResearcherId);
        var uploadedThisMonth = images.Count(i => i.CreatedAt >= monthStart);

        // --- Geography ---
        var municipalities = geo.Where(g => !string.IsNullOrWhiteSpace(g.Municipality))
            .Select(g => g.Municipality!).Distinct().Count();

        return new ResearcherDashboardDTO(
            TotalSpecies: species.Count,
            SensitiveSpecies: species.Count(s => s.IsSensitive),
            LegalStatusSpecies: species.Count(s => s.LegalStatus),
            ByConservationStatus: byConservation,
            ByKingdom: byKingdom,
            TopFamilies: topFamilies,
            TotalImages: images.Count,
            ValidatedImages: validated,
            PendingValidationImages: images.Count - validated,
            ImagesValidatedByMe: validatedByMe,
            ImagesUploadedThisMonth: uploadedThisMonth,
            GeographicRecordsCount: geo.Count,
            MunicipalitiesWithRecords: municipalities,
            SpeciesWithActiveAbsPermits: speciesWithPermits);
    }
}
