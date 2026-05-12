using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Dashboard.Queries;

// =============================================================================
// AUTHORITY DASHBOARD
// =============================================================================

public record GetAuthorityDashboardQuery(int ExpiryAlertDays = 90) : IRequest<AuthorityDashboardDTO>;

public class GetAuthorityDashboardQueryHandler : IRequestHandler<GetAuthorityDashboardQuery, AuthorityDashboardDTO>
{
    private readonly IAbsPermitRepository _absRepo;
    private readonly IProductRepository _productRepo;
    private readonly ISpeciesRepository _speciesRepo;

    public GetAuthorityDashboardQueryHandler(
        IAbsPermitRepository absRepo,
        IProductRepository productRepo,
        ISpeciesRepository speciesRepo)
    {
        _absRepo = absRepo; _productRepo = productRepo; _speciesRepo = speciesRepo;
    }

    public async Task<AuthorityDashboardDTO> Handle(GetAuthorityDashboardQuery request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var day30 = now.AddDays(30);
        var dayAlert = now.AddDays(request.ExpiryAlertDays);

        var absTask = _absRepo.GetAllPagedAsync(null, null, 1, 10000, ct);
        var productsTask = _productRepo.GetManagedFilteredAsync(null, true, null, null, "createdAt", "desc", 1, 10000, ct);
        var speciesTask = _speciesRepo.GetAllAsync(null, null, ct);

        await Task.WhenAll(absTask, productsTask, speciesTask);

        var (permits, _) = await absTask;
        var (products, _) = await productsTask;
        var speciesList = (await speciesTask).ToList();

        var permitList = permits.ToList();
        var productList = products.ToList();

        // --- ABS Permits ---
        var activePermits = permitList.Where(p => p.Status == "Active").ToList();

        var expiring30 = activePermits
            .Where(p => p.ExpirationDate <= day30)
            .Select(p => new PermitExpiryAlertDTO(
                p.Id, p.ResolutionNumber, p.EntrepreneurId, p.SpeciesId, p.ExpirationDate,
                (int)(p.ExpirationDate - now).TotalDays))
            .OrderBy(p => p.DaysUntilExpiry).ToList();

        var expiring90 = activePermits
            .Where(p => p.ExpirationDate <= dayAlert && p.ExpirationDate > day30)
            .Select(p => new PermitExpiryAlertDTO(
                p.Id, p.ResolutionNumber, p.EntrepreneurId, p.SpeciesId, p.ExpirationDate,
                (int)(p.ExpirationDate - now).TotalDays))
            .OrderBy(p => p.DaysUntilExpiry).ToList();

        var entrepreneursWithActive = activePermits.Select(p => p.EntrepreneurId).Distinct().Count();

        // Products without valid ABS permit
        var activePermitSpecies = permitList
            .Where(p => p.Status == "Active" && p.ExpirationDate > now)
            .GroupBy(p => p.EntrepreneurId)
            .ToDictionary(g => g.Key, g => g.Select(p => p.SpeciesId).ToHashSet());

        var productsWithoutPermit = productList.Count(prod =>
            !activePermitSpecies.TryGetValue(prod.EntrepreneurId, out var speciesSet) ||
            !speciesSet.Contains(prod.BaseSpeciesId));

        // --- Certifications ---
        var allCerts = productList.SelectMany(p => p.Certifications).ToList();
        var certsByType = allCerts
            .GroupBy(c => c.CertificationType)
            .Select(g => new CertTypeCountDTO(g.Key, g.Count())).ToList();

        var certExpiringSoon = allCerts
            .Where(c => c.ExpiresAt.HasValue && c.ExpiresAt.Value <= dayAlert && c.Status == "Active")
            .Select(c => new CertExpiryAlertDTO(
                c.Id, c.Name, c.CertificationType, c.ProductId,
                c.ExpiresAt!.Value, (int)(c.ExpiresAt.Value - now).TotalDays))
            .OrderBy(c => c.DaysUntilExpiry).Take(20).ToList();

        // --- Traceability ---
        var batchesWithHash = productList
            .SelectMany(p => p.TraceabilityBatches)
            .Count(b => !string.IsNullOrWhiteSpace(b.BlockchainHash));

        return new AuthorityDashboardDTO(
            TotalAbsPermits: permitList.Count,
            ActivePermits: permitList.Count(p => p.Status == "Active"),
            ExpiredPermits: permitList.Count(p => p.Status == "Expired"),
            SuspendedPermits: permitList.Count(p => p.Status == "Suspended"),
            RevokedPermits: permitList.Count(p => p.Status == "Revoked"),
            ExpiringIn30Days: expiring30,
            ExpiringIn90Days: expiring90,
            EntrepreneursWithActivePermits: entrepreneursWithActive,
            ProductsWithoutValidPermit: productsWithoutPermit,
            TotalCertifications: allCerts.Count,
            CertificationsByType: certsByType,
            CertificationsExpiringSoon: certExpiringSoon,
            BatchesWithBlockchainHash: batchesWithHash,
            LegalSpeciesCount: speciesList.Count(s => s.LegalStatus));
    }
}
