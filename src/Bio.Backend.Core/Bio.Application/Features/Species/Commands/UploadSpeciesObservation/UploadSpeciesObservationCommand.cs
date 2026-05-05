using Bio.Application.DTOs;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;
using System.Text.Json;

namespace Bio.Application.Features.Species.Commands.UploadSpeciesObservation;

/// <summary>
/// Command to upload a user-contributed species observation image to S3
/// and persist the metadata record in the PostgreSQL species_images table.
/// The Application layer receives a raw Stream to stay free of ASP.NET Core
/// dependencies. The Controller opens the IFormFile stream before dispatching.
/// </summary>
public record UploadSpeciesObservationCommand : IRequest<SpeciesImageDTO>
{
    /// <summary>ID of the species identified by the CNN.</summary>
    public Guid SpeciesId { get; init; }

    /// <summary>Raw image stream extracted from the uploaded file.</summary>
    public Stream FileStream { get; init; } = Stream.Null;

    /// <summary>Original file name (used only for extension detection).</summary>
    public string OriginalFileName { get; init; } = string.Empty;

    /// <summary>MIME content type of the uploaded file (e.g. image/jpeg).</summary>
    public string ContentType { get; init; } = string.Empty;

    /// <summary>ID of the authenticated user submitting the observation.</summary>
    public Guid UploaderUserId { get; init; }

    /// <summary>License under which the contributor shares this image.</summary>
    public string LicenseType { get; init; } = ObservationConstants.DefaultLicenseType;

    // ── Contextual fields (stored in metadata JSONB) ───────────────────────────

    /// <summary>Origin of the observation: "Mobile" or "Web".</summary>
    public string SourceType { get; init; } = ObservationConstants.SourceWeb;

    public string? Device { get; init; }
    public string? DeviceType { get; init; }
    public string? OperatingSystem { get; init; }

    /// <summary>GPS latitude. Null when the user denied location permission.</summary>
    public double? Latitude { get; init; }

    /// <summary>GPS longitude. Null when the user denied location permission.</summary>
    public double? Longitude { get; init; }

    public string? SpeciesPredicted { get; init; }
    public double? ConfidenceScore { get; init; }
    public string? ModelVersion { get; init; }
}

// ── Handler ───────────────────────────────────────────────────────────────────

/// <summary>
/// Handles <see cref="UploadSpeciesObservationCommand"/>:
/// 1. Verifies the species exists and retrieves its slug for the S3 key.
/// 2. Generates a timestamped filename with source prefix.
/// 3. Uploads the image to S3.
/// 4. Builds the structured metadata JSON.
/// 5. Persists the SpeciesImage entity via the repository.
/// </summary>
public class UploadSpeciesObservationCommandHandler
    : IRequestHandler<UploadSpeciesObservationCommand, SpeciesImageDTO>
{
    private readonly ISpeciesRepository _speciesRepository;
    private readonly ISpeciesImageRepository _imageRepository;
    private readonly IS3StorageService _s3StorageService;
    private readonly IScientificUnitOfWork _unitOfWork;

    public UploadSpeciesObservationCommandHandler(
        ISpeciesRepository speciesRepository,
        ISpeciesImageRepository imageRepository,
        IS3StorageService s3StorageService,
        IScientificUnitOfWork unitOfWork)
    {
        _speciesRepository = speciesRepository;
        _imageRepository = imageRepository;
        _s3StorageService = s3StorageService;
        _unitOfWork = unitOfWork;
    }

    public async Task<SpeciesImageDTO> Handle(
        UploadSpeciesObservationCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Verify species exists and get its slug for the S3 path
        var species = await _speciesRepository.GetByIdAsync(request.SpeciesId, cancellationToken)
            ?? throw new NotFoundException($"Species with id '{request.SpeciesId}' not found.");

        // 2. Generate filename: {prefix}_{yyyyMMddHHmmssfff}{extension}
        var fileNamePrefix = request.SourceType == ObservationConstants.SourceMobile
            ? ObservationConstants.FileNamePrefixMobile
            : ObservationConstants.FileNamePrefixWeb;

        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
        var extension = GetFileExtension(request.ContentType);
        var fileName = $"{fileNamePrefix}_{timestamp}{extension}";

        // 3. Build the S3 object key using the species slug
        var objectKey = $"{ObservationConstants.S3SpeciesImagesBasePath}/{species.Slug}/{fileName}";

        // 4. Upload to S3 using the raw stream
        var publicUrl = await _s3StorageService.UploadImageAsync(
            request.FileStream,
            objectKey,
            request.ContentType,
            cancellationToken);

        // 5. Build structured metadata JSONB
        var metadataDictionary = BuildMetadataDictionary(request);
        var metadataJson = JsonSerializer.Serialize(metadataDictionary);

        // 6. Create entity via factory
        var image = SpeciesImage.CreateObservation(
            speciesId: request.SpeciesId,
            imageUrl: publicUrl,
            uploaderUserId: request.UploaderUserId,
            metadataJson: metadataJson,
            licenseType: request.LicenseType);

        // 7. Persist
        var persisted = await _imageRepository.AddAsync(image, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 8. Map to DTO
        return new SpeciesImageDTO(
            persisted.Id,
            persisted.SpeciesId,
            persisted.ImageUrl,
            persisted.ThumbnailUrl,
            persisted.IsPrimary,
            persisted.IsValidatedByExpert,
            persisted.LicenseType,
            persisted.CreatedAt);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    /// <summary>
    /// Builds the structured metadata dictionary to be serialized as JSONB.
    /// All contextual observation data lives here — no additional DB columns needed.
    /// </summary>
    private static Dictionary<string, object?> BuildMetadataDictionary(
        UploadSpeciesObservationCommand request)
    {
        var locationDenied = !request.Latitude.HasValue && !request.Longitude.HasValue;

        var dict = new Dictionary<string, object?>
        {
            [ObservationConstants.MetadataKeySourceType] = request.SourceType,
            [ObservationConstants.MetadataKeyLocationDenied] = locationDenied,
        };

        if (!string.IsNullOrWhiteSpace(request.Device))
            dict[ObservationConstants.MetadataKeyDevice] = request.Device;

        if (!string.IsNullOrWhiteSpace(request.DeviceType))
            dict[ObservationConstants.MetadataKeyDeviceType] = request.DeviceType;

        if (!string.IsNullOrWhiteSpace(request.OperatingSystem))
            dict[ObservationConstants.MetadataKeyOperatingSystem] = request.OperatingSystem;

        if (request.Latitude.HasValue)
            dict[ObservationConstants.MetadataKeyLatitude] = request.Latitude.Value;

        if (request.Longitude.HasValue)
            dict[ObservationConstants.MetadataKeyLongitude] = request.Longitude.Value;

        if (!string.IsNullOrWhiteSpace(request.SpeciesPredicted))
            dict[ObservationConstants.MetadataKeySpeciesPredicted] = request.SpeciesPredicted;

        if (request.ConfidenceScore.HasValue)
            dict[ObservationConstants.MetadataKeyConfidenceScore] = request.ConfidenceScore.Value;

        if (!string.IsNullOrWhiteSpace(request.ModelVersion))
            dict[ObservationConstants.MetadataKeyModelVersion] = request.ModelVersion;

        return dict;
    }

    /// <summary>
    /// Maps a MIME content type to the corresponding file extension.
    /// Falls back to ".jpg" for unknown types (validator prevents reaching this).
    /// </summary>
    private static string GetFileExtension(string contentType) => contentType switch
    {
        "image/jpeg" => ".jpg",
        "image/png" => ".png",
        "image/webp" => ".webp",
        _ => ".jpg",
    };
}
