using Bio.Application.DTOs;
using Bio.Application.Features.Species.Queries.GetSpeciesImages;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using Moq;
using Xunit;
using SpeciesEntity = Bio.Domain.Entities.Species;

namespace Bio.UnitTests.Application.Features.Species.Queries;

/// <summary>
/// Unit tests for the <see cref="GetSpeciesImagesQueryHandler"/> query handler.
/// </summary>
public class SpeciesImagesQueryTests
{
    private readonly Mock<ISpeciesRepository> _speciesRepoMock;
    private readonly Mock<ISpeciesImageRepository> _imageRepoMock;

    public SpeciesImagesQueryTests()
    {
        _speciesRepoMock = new Mock<ISpeciesRepository>();
        _imageRepoMock = new Mock<ISpeciesImageRepository>();
    }

    [Fact]
    public async Task GetSpeciesImages_WhenSpeciesNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        _speciesRepoMock.Setup(r => r.GetByIdAsync(speciesId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((SpeciesEntity?)null);

        var handler = new GetSpeciesImagesQueryHandler(_speciesRepoMock.Object, _imageRepoMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            handler.Handle(new GetSpeciesImagesQuery(speciesId), CancellationToken.None));
    }

    [Fact]
    public async Task GetSpeciesImages_WhenSpeciesExists_ReturnsPaginatedResult()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        var species = new SpeciesEntity(speciesId, "test-species", "Test species");

        var images = new List<SpeciesImage>
        {
            new(speciesId, "https://example.com/img1.jpg"),
            new(speciesId, "https://example.com/img2.jpg"),
            new(speciesId, "https://example.com/img3.jpg"),
        };

        _speciesRepoMock.Setup(r => r.GetByIdAsync(speciesId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(species);

        _imageRepoMock.Setup(r => r.GetBySpeciesIdAsync(
                speciesId, true, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync((images, 3));

        var handler = new GetSpeciesImagesQueryHandler(_speciesRepoMock.Object, _imageRepoMock.Object);

        // Act
        var result = await handler.Handle(
            new GetSpeciesImagesQuery(speciesId, OnlyValidatedByExpert: true, Page: 1, PageSize: 20),
            CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.TotalCount);
        Assert.Equal(3, result.Items.Count);
        Assert.Equal(1, result.Page);
        Assert.Equal(20, result.PageSize);
        Assert.False(result.HasNextPage);
    }

    [Fact]
    public async Task GetSpeciesImages_ShouldMapDtoFieldsCorrectly()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        var species = new SpeciesEntity(speciesId, "test-species", "Test species");
        var image = new SpeciesImage(speciesId, "https://example.com/img.jpg");

        _speciesRepoMock.Setup(r => r.GetByIdAsync(speciesId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(species);

        _imageRepoMock.Setup(r => r.GetBySpeciesIdAsync(
                speciesId, true, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync((new List<SpeciesImage> { image }, 1));

        var handler = new GetSpeciesImagesQueryHandler(_speciesRepoMock.Object, _imageRepoMock.Object);

        // Act
        var result = await handler.Handle(
            new GetSpeciesImagesQuery(speciesId), CancellationToken.None);

        // Assert
        var dto = Assert.Single(result.Items);
        Assert.Equal(image.Id, dto.Id);
        Assert.Equal(speciesId, dto.SpeciesId);
        Assert.Equal("https://example.com/img.jpg", dto.ImageUrl);
        Assert.Null(dto.ThumbnailUrl);
        Assert.False(dto.IsPrimary);
        Assert.False(dto.IsValidatedByExpert);
        Assert.Equal("CC-BY", dto.LicenseType);
    }

    [Fact]
    public async Task GetSpeciesImages_WithFilterOff_PassesFalseToRepository()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        var species = new SpeciesEntity(speciesId, "test-species", "Test species");

        _speciesRepoMock.Setup(r => r.GetByIdAsync(speciesId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(species);

        _imageRepoMock.Setup(r => r.GetBySpeciesIdAsync(
                speciesId, false, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync((new List<SpeciesImage>(), 0));

        var handler = new GetSpeciesImagesQueryHandler(_speciesRepoMock.Object, _imageRepoMock.Object);

        // Act
        await handler.Handle(
            new GetSpeciesImagesQuery(speciesId, OnlyValidatedByExpert: false),
            CancellationToken.None);

        // Assert — verify the repository was called with onlyValidatedByExpert = false
        _imageRepoMock.Verify(r => r.GetBySpeciesIdAsync(
            speciesId, false, 1, 20, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetSpeciesImages_WithCustomPagination_PassesCorrectParams()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        var species = new SpeciesEntity(speciesId, "test-species", "Test species");

        _speciesRepoMock.Setup(r => r.GetByIdAsync(speciesId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(species);

        _imageRepoMock.Setup(r => r.GetBySpeciesIdAsync(
                speciesId, true, 3, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync((new List<SpeciesImage>(), 25));

        var handler = new GetSpeciesImagesQueryHandler(_speciesRepoMock.Object, _imageRepoMock.Object);

        // Act
        var result = await handler.Handle(
            new GetSpeciesImagesQuery(speciesId, Page: 3, PageSize: 10),
            CancellationToken.None);

        // Assert
        Assert.Equal(3, result.Page);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(25, result.TotalCount);
        Assert.Equal(3, result.TotalPages);
        Assert.True(result.HasPreviousPage);
        Assert.False(result.HasNextPage);
    }

    [Fact]
    public async Task GetSpeciesImages_WithMultiplePages_ComputesPaginationCorrectly()
    {
        // Arrange
        var speciesId = Guid.NewGuid();
        var species = new SpeciesEntity(speciesId, "test-species", "Test species");

        var images = Enumerable.Range(1, 20)
            .Select(i => new SpeciesImage(speciesId, $"https://example.com/img{i}.jpg"))
            .ToList();

        _speciesRepoMock.Setup(r => r.GetByIdAsync(speciesId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(species);

        _imageRepoMock.Setup(r => r.GetBySpeciesIdAsync(
                speciesId, true, 1, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync((images, 45));

        var handler = new GetSpeciesImagesQueryHandler(_speciesRepoMock.Object, _imageRepoMock.Object);

        // Act
        var result = await handler.Handle(
            new GetSpeciesImagesQuery(speciesId), CancellationToken.None);

        // Assert
        Assert.Equal(45, result.TotalCount);
        Assert.Equal(20, result.Items.Count);
        Assert.Equal(3, result.TotalPages);
        Assert.True(result.HasNextPage);
        Assert.False(result.HasPreviousPage);
    }
}
