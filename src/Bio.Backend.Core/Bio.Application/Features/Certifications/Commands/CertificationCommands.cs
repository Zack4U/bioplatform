using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Certifications.Commands;

public record CreateCertificationCommand(Guid ProductId, CertificationCreateDTO Dto, Guid ActorId, string ActorRole) : IRequest<CertificationResponseDTO>;

public class CreateCertificationCommandHandler : IRequestHandler<CreateCertificationCommand, CertificationResponseDTO>
{
    private readonly ICertificationRepository _repo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public CreateCertificationCommandHandler(ICertificationRepository repo, IProductRepository productRepo, IUnitOfWork uow)
    { _repo = repo; _productRepo = productRepo; _uow = uow; }

    public async Task<CertificationResponseDTO> Handle(CreateCertificationCommand request, CancellationToken ct)
    {
        var product = await _productRepo.GetByIdAsync(request.ProductId, ct)
            ?? throw new NotFoundException(nameof(Product), request.ProductId);
        if (request.ActorRole != "ADMIN" && product.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only manage certifications for your own products.");

        var cert = new Certification(request.ProductId, request.Dto.Name, request.Dto.CertificationType,
            request.Dto.IssuingBody, request.Dto.IssuedAt, request.Dto.CertificateNumber,
            request.Dto.ExpiresAt, request.Dto.DocumentUrl, request.Dto.LogoUrl, request.Dto.VerificationCode);
        await _repo.AddAsync(cert, ct);
        await _uow.SaveChangesAsync(ct);
        return MapToResponse(cert);
    }

    internal static CertificationResponseDTO MapToResponse(Certification c) => new(
        c.Id, c.ProductId, c.Name, c.CertificationType, c.IssuingBody, c.CertificateNumber,
        c.IssuedAt, c.ExpiresAt, c.Status, c.DocumentUrl, c.LogoUrl, c.VerificationCode, c.CreatedAt, c.UpdatedAt,
        c.ApprovedById, c.ApprovedAt, c.RejectionReason);
}

// =============================================================================
// APPROVE / REJECT CERTIFICATION (Admin / Authority)
// =============================================================================

public record ApproveCertificationCommand(Guid CertId, Guid ApproverId) : IRequest<CertificationResponseDTO>;

public class ApproveCertificationCommandHandler : IRequestHandler<ApproveCertificationCommand, CertificationResponseDTO>
{
    private readonly ICertificationRepository _repo;
    private readonly IUnitOfWork _uow;

    public ApproveCertificationCommandHandler(ICertificationRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<CertificationResponseDTO> Handle(ApproveCertificationCommand request, CancellationToken ct)
    {
        var cert = await _repo.GetByIdAsync(request.CertId, ct)
            ?? throw new NotFoundException(nameof(Certification), request.CertId);
        cert.Approve(request.ApproverId);
        await _uow.SaveChangesAsync(ct);
        return CreateCertificationCommandHandler.MapToResponse(cert);
    }
}

public record RejectCertificationCommand(Guid CertId, Guid ApproverId, string Reason) : IRequest<CertificationResponseDTO>;

public class RejectCertificationCommandHandler : IRequestHandler<RejectCertificationCommand, CertificationResponseDTO>
{
    private readonly ICertificationRepository _repo;
    private readonly IUnitOfWork _uow;

    public RejectCertificationCommandHandler(ICertificationRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<CertificationResponseDTO> Handle(RejectCertificationCommand request, CancellationToken ct)
    {
        var cert = await _repo.GetByIdAsync(request.CertId, ct)
            ?? throw new NotFoundException(nameof(Certification), request.CertId);
        cert.Reject(request.ApproverId, request.Reason);
        await _uow.SaveChangesAsync(ct);
        return CreateCertificationCommandHandler.MapToResponse(cert);
    }
}

public record UpdateCertificationCommand(Guid CertId, CertificationUpdateDTO Dto, Guid ActorId, string ActorRole) : IRequest<CertificationResponseDTO>;

public class UpdateCertificationCommandHandler : IRequestHandler<UpdateCertificationCommand, CertificationResponseDTO>
{
    private readonly ICertificationRepository _repo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public UpdateCertificationCommandHandler(ICertificationRepository repo, IProductRepository productRepo, IUnitOfWork uow)
    { _repo = repo; _productRepo = productRepo; _uow = uow; }

    public async Task<CertificationResponseDTO> Handle(UpdateCertificationCommand request, CancellationToken ct)
    {
        var cert = await _repo.GetByIdAsync(request.CertId, ct)
            ?? throw new NotFoundException(nameof(Certification), request.CertId);
        var product = await _productRepo.GetByIdAsync(cert.ProductId, ct)!;
        if (request.ActorRole != "ADMIN" && product!.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only manage certifications for your own products.");

        cert.Update(request.Dto.Name, request.Dto.CertificationType, request.Dto.IssuingBody,
            request.Dto.CertificateNumber, request.Dto.ExpiresAt, request.Dto.Status,
            request.Dto.DocumentUrl, request.Dto.LogoUrl, request.Dto.VerificationCode);
        await _uow.SaveChangesAsync(ct);
        return CreateCertificationCommandHandler.MapToResponse(cert);
    }
}

public record DeleteCertificationCommand(Guid CertId, Guid ActorId, string ActorRole) : IRequest<Unit>;

public class DeleteCertificationCommandHandler : IRequestHandler<DeleteCertificationCommand, Unit>
{
    private readonly ICertificationRepository _repo;
    private readonly IProductRepository _productRepo;
    private readonly IUnitOfWork _uow;

    public DeleteCertificationCommandHandler(ICertificationRepository repo, IProductRepository productRepo, IUnitOfWork uow)
    { _repo = repo; _productRepo = productRepo; _uow = uow; }

    public async Task<Unit> Handle(DeleteCertificationCommand request, CancellationToken ct)
    {
        var cert = await _repo.GetByIdAsync(request.CertId, ct)
            ?? throw new NotFoundException(nameof(Certification), request.CertId);
        var product = await _productRepo.GetByIdAsync(cert.ProductId, ct)!;
        if (request.ActorRole != "ADMIN" && product!.EntrepreneurId != request.ActorId)
            throw new ForbiddenException("You can only manage certifications for your own products.");

        await _repo.DeleteAsync(cert, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
