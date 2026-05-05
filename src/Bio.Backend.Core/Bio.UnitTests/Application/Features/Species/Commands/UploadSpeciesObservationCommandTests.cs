using Bio.Application.Features.Species.Commands.UploadSpeciesObservation;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using System.Text.Json;

namespace Bio.UnitTests.Application.Features.Species.Commands;

/// <summary>
/// Unit tests for <see cref="UploadSpeciesObservationCommandHandler"/>.
/// Verifies correct S3 path construction, metadata serialization,
/// and validation behaviors without hitting any real infrastructure.
/// </summary>
public class UploadSpeciesObservationCommandTests
{
    // ── Test Fixtures ─────────────────────────────────────────────────────────

    private readonly Mock<ISpeciesRepository> _speciesRepo = new();
    private readonly Mock<ISpeciesImageRepository> _imageRepo = new();
    private readonly Mock<IS3StorageService> _s3 = new();
    private readonly Mock<IScientificUnitOfWork> _uow = new();

    private UploadSpeciesObservationCommandHandler CreateHandler() =>
        new(_speciesRepo.Object, _imageRepo.Object, _s3.Object, _uow.Object);

    private static Bio.Domain.Entities.Species MakeSpecies(
        Guid id,
        string slug = "heliconia-psittacorum") =>
        new(id, slug, "Heliconia psittacorum");

    private static Stream MakeFakeStream(int lengthBytes = 1024)
    {
        var data = new byte[lengthBytes];
        new Random().NextBytes(data);
        return new MemoryStream(data);
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidCommandWithCoords_ReturnsDto()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        var species = MakeSpecies(speciesId);
        var uploaderId = Guid.NewGuid();

        _speciesRepo.Setup(r => r.GetByIdAsync(speciesId, default)).ReturnsAsync(species);
        _s3.Setup(s => s.UploadImageAsync(It.IsAny<Stream>(), It.IsAny<string>(),
                It.IsAny<string>(), default))
            .ReturnsAsync("https://bioplatform-public.s3.us-east-1.amazonaws.com/assets/images/species/heliconia-psittacorum/mobile_20260419000000000.jpg");
        _imageRepo.Setup(r => r.AddAsync(It.IsAny<SpeciesImage>(), default))
            .ReturnsAsync((SpeciesImage img, CancellationToken _) => img);
        _uow.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new UploadSpeciesObservationCommand
        {
            SpeciesId = speciesId,
            FileStream = MakeFakeStream(),
            ContentType = "image/jpeg",
            OriginalFileName = "photo.jpg",
            UploaderUserId = uploaderId,
            LicenseType = "CC-BY",
            SourceType = ObservationConstants.SourceMobile,
            Latitude = 5.0703,
            Longitude = -75.5138,
            SpeciesPredicted = "Heliconia psittacorum",
            ConfidenceScore = 0.87,
            ModelVersion = "v1.2.0",
        };

        // Act
        var result = await CreateHandler().Handle(command, default);

        // Assert
        result.Should().NotBeNull();
        _s3.Verify(s => s.UploadImageAsync(
            It.IsAny<Stream>(),
            It.Is<string>(k => k.StartsWith("assets/images/species/heliconia-psittacorum/mobile_")),
            "image/jpeg",
            default), Times.Once);
    }

    [Fact]
    public async Task Handle_ValidCommandWithoutCoords_SetsLocationDeniedInMetadata()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        _speciesRepo.Setup(r => r.GetByIdAsync(speciesId, default))
            .ReturnsAsync(MakeSpecies(speciesId));

        SpeciesImage? captured = null;
        _imageRepo.Setup(r => r.AddAsync(It.IsAny<SpeciesImage>(), default))
            .Callback<SpeciesImage, CancellationToken>((img, _) => captured = img)
            .ReturnsAsync((SpeciesImage img, CancellationToken _) => img);
        _s3.Setup(s => s.UploadImageAsync(It.IsAny<Stream>(), It.IsAny<string>(),
                It.IsAny<string>(), default))
            .ReturnsAsync("https://example.com/image.jpg");
        _uow.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new UploadSpeciesObservationCommand
        {
            SpeciesId = speciesId,
            FileStream = MakeFakeStream(),
            ContentType = "image/jpeg",
            OriginalFileName = "photo.jpg",
            UploaderUserId = Guid.NewGuid(),
            LicenseType = "CC-BY",
            SourceType = ObservationConstants.SourceWeb,
            Latitude = null,
            Longitude = null,
        };

        // Act
        await CreateHandler().Handle(command, default);

        // Assert — metadata must contain location_denied: true
        captured.Should().NotBeNull();
        var metadata = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(captured!.Metadata!);
        metadata.Should().ContainKey(ObservationConstants.MetadataKeyLocationDenied);
        metadata![ObservationConstants.MetadataKeyLocationDenied].GetBoolean().Should().BeTrue();
        metadata.Should().NotContainKey(ObservationConstants.MetadataKeyLatitude);
        metadata.Should().NotContainKey(ObservationConstants.MetadataKeyLongitude);
    }

    [Fact]
    public async Task Handle_SpeciesNotFound_ThrowsNotFoundException()
    {
        // Arrange
        _speciesRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync((Bio.Domain.Entities.Species?)null);

        var command = new UploadSpeciesObservationCommand
        {
            SpeciesId = Guid.NewGuid(),
            FileStream = MakeFakeStream(),
            ContentType = "image/jpeg",
            OriginalFileName = "photo.jpg",
            UploaderUserId = Guid.NewGuid(),
            LicenseType = "CC-BY",
            SourceType = ObservationConstants.SourceWeb,
        };

        // Act & Assert
        await FluentActions.Awaiting(() => CreateHandler().Handle(command, default))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_MobileSource_FilenamePrefixIsMobile()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        _speciesRepo.Setup(r => r.GetByIdAsync(speciesId, default))
            .ReturnsAsync(MakeSpecies(speciesId, "quercus-humboldtii"));

        string? capturedKey = null;
        _s3.Setup(s => s.UploadImageAsync(It.IsAny<Stream>(), It.IsAny<string>(),
                It.IsAny<string>(), default))
            .Callback<Stream, string, string, CancellationToken>((_, key, _, _) => capturedKey = key)
            .ReturnsAsync("https://example.com/img.jpg");
        _imageRepo.Setup(r => r.AddAsync(It.IsAny<SpeciesImage>(), default))
            .ReturnsAsync((SpeciesImage img, CancellationToken _) => img);
        _uow.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new UploadSpeciesObservationCommand
        {
            SpeciesId = speciesId,
            FileStream = MakeFakeStream(),
            ContentType = "image/png",
            OriginalFileName = "snap.png",
            UploaderUserId = Guid.NewGuid(),
            LicenseType = "CC-BY-NC",
            SourceType = ObservationConstants.SourceMobile,
        };

        // Act
        await CreateHandler().Handle(command, default);

        // Assert
        capturedKey.Should().StartWith("assets/images/species/quercus-humboldtii/mobile_");
        capturedKey.Should().EndWith(".png");
    }

    [Fact]
    public async Task Handle_WebSource_FilenamePrefixIsWeb()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        _speciesRepo.Setup(r => r.GetByIdAsync(speciesId, default))
            .ReturnsAsync(MakeSpecies(speciesId, "especie-web"));

        string? capturedKey = null;
        _s3.Setup(s => s.UploadImageAsync(It.IsAny<Stream>(), It.IsAny<string>(),
                It.IsAny<string>(), default))
            .Callback<Stream, string, string, CancellationToken>((_, key, _, _) => capturedKey = key)
            .ReturnsAsync("https://example.com/img.jpg");
        _imageRepo.Setup(r => r.AddAsync(It.IsAny<SpeciesImage>(), default))
            .ReturnsAsync((SpeciesImage img, CancellationToken _) => img);
        _uow.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new UploadSpeciesObservationCommand
        {
            SpeciesId = speciesId,
            FileStream = MakeFakeStream(),
            ContentType = "image/webp",
            OriginalFileName = "capture.webp",
            UploaderUserId = Guid.NewGuid(),
            LicenseType = "CC-BY",
            SourceType = ObservationConstants.SourceWeb,
        };

        // Act
        await CreateHandler().Handle(command, default);

        // Assert
        capturedKey.Should().StartWith("assets/images/species/especie-web/web_");
        capturedKey.Should().EndWith(".webp");
    }

    [Fact]
    public async Task Handle_WithAllMetadataFields_SerializesCorrectly()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        _speciesRepo.Setup(r => r.GetByIdAsync(speciesId, default))
            .ReturnsAsync(MakeSpecies(speciesId));

        SpeciesImage? captured = null;
        _imageRepo.Setup(r => r.AddAsync(It.IsAny<SpeciesImage>(), default))
            .Callback<SpeciesImage, CancellationToken>((img, _) => captured = img)
            .ReturnsAsync((SpeciesImage img, CancellationToken _) => img);
        _s3.Setup(s => s.UploadImageAsync(It.IsAny<Stream>(), It.IsAny<string>(),
                It.IsAny<string>(), default))
            .ReturnsAsync("https://example.com/img.jpg");
        _uow.Setup(u => u.SaveChangesAsync(default)).ReturnsAsync(1);

        var command = new UploadSpeciesObservationCommand
        {
            SpeciesId = speciesId,
            FileStream = MakeFakeStream(),
            ContentType = "image/jpeg",
            OriginalFileName = "photo.jpg",
            UploaderUserId = Guid.NewGuid(),
            LicenseType = "CC-BY",
            SourceType = ObservationConstants.SourceMobile,
            Device = "iPhone 15 Pro",
            DeviceType = "smartphone",
            OperatingSystem = "iOS 17.4",
            Latitude = 5.0703,
            Longitude = -75.5138,
            SpeciesPredicted = "Heliconia psittacorum",
            ConfidenceScore = 0.87,
            ModelVersion = "v1.2.0",
        };

        // Act
        await CreateHandler().Handle(command, default);

        // Assert metadata keys
        captured.Should().NotBeNull();
        var metadata = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(captured!.Metadata!);
        metadata.Should().ContainKey(ObservationConstants.MetadataKeySourceType);
        metadata.Should().ContainKey(ObservationConstants.MetadataKeyDevice);
        metadata.Should().ContainKey(ObservationConstants.MetadataKeyLatitude);
        metadata.Should().ContainKey(ObservationConstants.MetadataKeyLongitude);
        metadata.Should().ContainKey(ObservationConstants.MetadataKeyConfidenceScore);
        metadata.Should().ContainKey(ObservationConstants.MetadataKeyModelVersion);
        metadata![ObservationConstants.MetadataKeyLocationDenied].GetBoolean().Should().BeFalse();
    }
}
