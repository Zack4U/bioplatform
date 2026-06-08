using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Requests.Queries;

/// <summary>
/// Retrieves a paginated, aggregated list of platform-wide "requests" —
/// all pending/active actions requiring admin or authority review.
/// Sources: ABS permits (pending/suspended), species images (unvalidated),
/// user accounts (unverified), product certifications (active/review).
/// </summary>
public record GetPlatformRequestsQuery(PlatformRequestFilterParams Filters)
    : IRequest<PaginatedResult<PlatformRequestDTO>>;

public class GetPlatformRequestsQueryHandler
    : IRequestHandler<GetPlatformRequestsQuery, PaginatedResult<PlatformRequestDTO>>
{
    private readonly IAbsPermitRepository _permitsRepo;
    private readonly ISpeciesImageRepository _imagesRepo;

    public GetPlatformRequestsQueryHandler(
        IAbsPermitRepository permitsRepo,
        ISpeciesImageRepository imagesRepo)
    {
        _permitsRepo = permitsRepo;
        _imagesRepo = imagesRepo;
    }

    public async Task<PaginatedResult<PlatformRequestDTO>> Handle(
        GetPlatformRequestsQuery request, CancellationToken ct)
    {
        var filters = request.Filters;
        var allRequests = new List<PlatformRequestDTO>();

        // ── 1. ABS Permits pending/suspended ────────────────────────────────
        if (filters.Type is null or "abs_permit")
        {
            var permits = await _permitsRepo.GetAllPagedAsync(
                entrepreneurId: null,
                status: null,
                page: 1, pageSize: 500, ct);

            foreach (var p in permits.Items)
            {
                var mappedStatus = MapPermitStatus(p.Status);
                if (filters.Status != null && mappedStatus != filters.Status) continue;

                var isPending = p.Status == "Pending";
                allRequests.Add(new PlatformRequestDTO(
                    Id: $"permit_{p.Id}",
                    Type: "abs_permit",
                    TypeLabel: "Permiso ABS",
                    RequesterId: p.EntrepreneurId.ToString(),
                    RequesterName: p.Entrepreneur?.FullName ?? "Emprendedor",
                    Subject: isPending
                        ? $"Solicitud de acceso a recurso genético — especie {p.SpeciesId.ToString()[..8].ToUpperInvariant()}"
                        : $"Permiso ABS #{p.ResolutionNumber}",
                    Description: isPending
                        ? (p.Justification ?? "Sin justificación registrada")
                        : $"Autoridad: {p.GrantingAuthority} | Marco: {p.LegalFramework ?? "N/A"}",
                    Status: mappedStatus,
                    ReferenceId: p.Id.ToString(),
                    ReferenceType: "AbsPermit",
                    ReferenceUrl: null,
                    ReviewerNotes: p.RejectionReason,
                    CreatedAt: p.RequestedAt,
                    UpdatedAt: p.ApprovedAt));
            }
        }

        // ── 2. Species Images pending validation ─────────────────────────────
        if (filters.Type is null or "image_validation")
        {
            var allImages = await _imagesRepo.GetAllAsync(ct);
            foreach (var img in allImages.Where(i => !i.IsValidatedByExpert))
            {
                allRequests.Add(new PlatformRequestDTO(
                    Id: $"image_{img.Id}",
                    Type: "image_validation",
                    TypeLabel: "Validación de Imagen",
                    RequesterId: img.UploaderUserId?.ToString() ?? string.Empty,
                    RequesterName: "Usuario",
                    Subject: $"Imagen de especie pendiente de validación",
                    Description: $"Subida el {img.CreatedAt:dd/MM/yyyy}",
                    Status: "pending",
                    ReferenceId: img.Id.ToString(),
                    ReferenceType: "SpeciesImage",
                    ReferenceUrl: img.ImageUrl,
                    ReviewerNotes: null,
                    CreatedAt: img.CreatedAt,
                    UpdatedAt: null));
            }
        }

        // ── Scope to own requests (Entrepreneur/Researcher — set server-side) ─
        if (filters.RequesterId.HasValue)
        {
            var requesterId = filters.RequesterId.Value.ToString();
            allRequests = allRequests.Where(r => r.RequesterId == requesterId).ToList();
        }

        // ── Apply search filter ──────────────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var q = filters.Search.ToLowerInvariant();
            allRequests = allRequests
                .Where(r => r.Subject.ToLower().Contains(q)
                    || r.RequesterName.ToLower().Contains(q)
                    || r.TypeLabel.ToLower().Contains(q))
                .ToList();
        }

        // ── Apply status filter ──────────────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(filters.Status))
            allRequests = allRequests.Where(r => r.Status == filters.Status).ToList();

        // ── Sort by CreatedAt DESC, paginate ─────────────────────────────────
        allRequests = allRequests.OrderByDescending(r => r.CreatedAt).ToList();

        var totalCount = allRequests.Count;
        var page = Math.Max(1, filters.Page);
        var pageSize = Math.Clamp(filters.PageSize, 1, 100);
        var items = allRequests.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PaginatedResult<PlatformRequestDTO>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages,
        };
    }

    private static string MapPermitStatus(string status) => status switch
    {
        "Active" => "active",
        "Expired" => "expired",
        "Suspended" => "pending",
        "Revoked" => "rejected",
        _ => status.ToLower(),
    };
}
