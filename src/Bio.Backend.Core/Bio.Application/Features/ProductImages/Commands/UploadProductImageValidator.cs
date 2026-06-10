using Bio.Domain.Constants;
using FluentValidation;

namespace Bio.Application.Features.ProductImages.Commands;

/// <summary>
/// FluentValidation validator for <see cref="AddProductImageCommand"/>.
/// Enforces file constraints and allowed values without magic strings or numbers.
/// </summary>
public class UploadProductImageValidator : AbstractValidator<AddProductImageCommand>
{
    public UploadProductImageValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty()
            .WithMessage("Product ID is required.");

        RuleFor(x => x.ActorId)
            .NotEmpty()
            .WithMessage("Actor user ID is required.");

        RuleFor(x => x.FileStream)
            .NotNull()
            .Must(s => s != Stream.Null && s.Length > 0)
            .WithMessage("An image file with content is required.");

        RuleFor(x => x.FileStream.Length)
            .LessThanOrEqualTo(ObservationConstants.MaxFileSizeBytes)
            .When(x => x.FileStream != null && x.FileStream != Stream.Null)
            .WithMessage(
                $"File size must not exceed {ObservationConstants.MaxFileSizeBytes / 1024 / 1024} MB.");

        RuleFor(x => x.ContentType)
            .NotEmpty()
            .Must(ct => ObservationConstants.AllowedContentTypes.Contains(ct))
            .WithMessage(
                $"Only the following image types are accepted: " +
                $"{string.Join(", ", ObservationConstants.AllowedContentTypes)}.");

        RuleFor(x => x.AltText)
            .MaximumLength(200)
            .When(x => x.AltText != null)
            .WithMessage("Alt text must not exceed 200 characters.");
    }
}
