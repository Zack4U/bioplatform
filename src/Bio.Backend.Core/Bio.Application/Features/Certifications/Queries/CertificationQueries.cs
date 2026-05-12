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
