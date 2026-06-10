using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using Bio.Domain.Exceptions;
using MediatR;
using Bio.Application.Features.Certifications.Commands;

namespace Bio.Application.Features.Certifications.Queries;

public record GetProductCertificationsQuery(Guid ProductId) : IRequest<IReadOnlyList<CertificationResponseDTO>>;

public class GetProductCertificationsQueryHandler : IRequestHandler<GetProductCertificationsQuery, IReadOnlyList<CertificationResponseDTO>>
{
    private readonly ICertificationRepository _repo;
    public GetProductCertificationsQueryHandler(ICertificationRepository repo) => _repo = repo;

    public async Task<IReadOnlyList<CertificationResponseDTO>> Handle(GetProductCertificationsQuery request, CancellationToken ct)
    {
        var items = await _repo.GetByProductIdAsync(request.ProductId, ct);
        return items.Select(CreateCertificationCommandHandler.MapToResponse).ToList();
    }
}

// =============================================================================
// GET CERTIFICATION BY ID
// =============================================================================

public record GetCertificationByIdQuery(Guid CertId) : IRequest<CertificationResponseDTO>;

public class GetCertificationByIdQueryHandler : IRequestHandler<GetCertificationByIdQuery, CertificationResponseDTO>
{
    private readonly ICertificationRepository _repo;
    public GetCertificationByIdQueryHandler(ICertificationRepository repo) => _repo = repo;

    public async Task<CertificationResponseDTO> Handle(GetCertificationByIdQuery request, CancellationToken ct)
    {
        var cert = await _repo.GetByIdAsync(request.CertId, ct)
            ?? throw new NotFoundException(nameof(Bio.Domain.Entities.Certification), request.CertId);
        return CreateCertificationCommandHandler.MapToResponse(cert);
    }
}

// =============================================================================
// MANAGED CERTIFICATIONS LIST (admin moderation / entrepreneur own)
// =============================================================================

public record GetManagedCertificationsQuery(
    string? Status = null, Guid? EntrepreneurId = null, int Page = 1, int PageSize = 12)
    : IRequest<PaginatedResult<CertificationManagedListItemDTO>>;

public class GetManagedCertificationsQueryHandler
    : IRequestHandler<GetManagedCertificationsQuery, PaginatedResult<CertificationManagedListItemDTO>>
{
    private readonly ICertificationRepository _repo;
    public GetManagedCertificationsQueryHandler(ICertificationRepository repo) => _repo = repo;

    public async Task<PaginatedResult<CertificationManagedListItemDTO>> Handle(
        GetManagedCertificationsQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetManagedAsync(
            request.Status, request.EntrepreneurId, request.Page, request.PageSize, ct);

        var dtos = items.Select(c => new CertificationManagedListItemDTO(
            c.Id, c.ProductId, c.Product?.Name ?? "", c.Product?.Slug ?? "",
            c.Name, c.CertificationType, c.IssuingBody, c.Status,
            c.IssuedAt, c.ExpiresAt,
            c.Product?.EntrepreneurId ?? System.Guid.Empty, c.Product?.Entrepreneur?.FullName,
            c.ApprovedById, c.ApprovedAt, c.RejectionReason,
            c.DocumentUrl, c.CreatedAt)).ToList();

        return PaginatedResult<CertificationManagedListItemDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}
