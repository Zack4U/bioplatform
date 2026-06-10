using Bio.Domain.Constants;
using FluentValidation;

namespace Bio.Application.Features.Species.Commands.UploadSpeciesObservation;

/// <summary>
/// FluentValidation validator for <see cref="UploadSpeciesObservationCommand"/>.
/// Enforces file constraints and allowed values without magic strings or numbers.
/// The Command carries ContentType and FileSize (set by the Controller) so that
/// the Application layer stays free of ASP.NET Core types.
/// </summary>
public class UploadSpeciesObservationValidator
    : AbstractValidator<UploadSpeciesObservationCommand>
{
    public UploadSpeciesObservationValidator()
    {
        RuleFor(x => x.SpeciesId)
            .NotEmpty()
            .WithMessage("Species ID is required.");

        RuleFor(x => x.UploaderUserId)
            .NotEmpty()
            .WithMessage("Uploader user ID is required.");

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

        RuleFor(x => x.LicenseType)
            .NotEmpty()
            .WithMessage("License type is required.")
            .MaximumLength(50)
            .WithMessage("License type must not exceed 50 characters.");

        RuleFor(x => x.SourceType)
            .Must(st => ObservationConstants.ValidSourceTypes.Contains(st))
            .WithMessage(
                $"Source type must be one of: " +
                $"{string.Join(", ", ObservationConstants.ValidSourceTypes)}.");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90.0, 90.0)
            .When(x => x.Latitude.HasValue)
            .WithMessage("Latitude must be between -90 and 90.");

        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180.0, 180.0)
            .When(x => x.Longitude.HasValue)
            .WithMessage("Longitude must be between -180 and 180.");

        RuleFor(x => x.ConfidenceScore)
            .InclusiveBetween(0.0, 1.0)
            .When(x => x.ConfidenceScore.HasValue)
            .WithMessage("Confidence score must be between 0 and 1.");
    }
}
