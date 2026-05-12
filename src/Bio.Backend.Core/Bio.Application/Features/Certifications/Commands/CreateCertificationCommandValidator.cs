using Bio.Application.Features.Certifications.Commands;
using FluentValidation;

namespace Bio.Application.Features.Certifications.Commands;

public class CreateCertificationCommandValidator : AbstractValidator<CreateCertificationCommand>
{
    public CreateCertificationCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Dto.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Dto.CertificationType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Dto.IssuingBody).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Dto.CertificateNumber).MaximumLength(100).When(x => x.Dto.CertificateNumber != null);
        RuleFor(x => x.Dto.IssuedAt).NotEmpty().LessThanOrEqualTo(DateTime.UtcNow.AddDays(1))
            .WithMessage("Issued date cannot be in the future.");
        RuleFor(x => x.Dto.ExpiresAt)
            .GreaterThan(x => x.Dto.IssuedAt)
            .When(x => x.Dto.ExpiresAt.HasValue)
            .WithMessage("Expiry date must be after the issuance date.");
        RuleFor(x => x.Dto.DocumentUrl).MaximumLength(500).When(x => x.Dto.DocumentUrl != null);
        RuleFor(x => x.Dto.LogoUrl).MaximumLength(500).When(x => x.Dto.LogoUrl != null);
        RuleFor(x => x.Dto.VerificationCode).MaximumLength(100).When(x => x.Dto.VerificationCode != null);
    }
}
