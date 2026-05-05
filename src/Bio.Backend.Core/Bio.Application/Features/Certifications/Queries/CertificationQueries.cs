using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
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
