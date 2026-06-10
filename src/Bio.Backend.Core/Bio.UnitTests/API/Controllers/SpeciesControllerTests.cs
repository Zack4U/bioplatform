using Bio.API.Controllers;
using Bio.Application.DTOs;
using Bio.Application.Features.Species.Queries.GetSpeciesImages;
using Bio.Domain.Exceptions;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Moq;
using Xunit;

namespace Bio.UnitTests.API.Controllers;

/// <summary>
/// Unit tests for the <see cref="SpeciesController"/> class,
/// specifically the GetImages endpoint.
/// Uses a mocked <see cref="IMediator"/> following the established controller test pattern.
/// </summary>
public class SpeciesControllerTests
{
    private readonly Mock<IMediator> _mediatorMock;
    private readonly SpeciesController _controller;

    public SpeciesControllerTests()
    {
        _mediatorMock = new Mock<IMediator>();
        _controller = new SpeciesController(_mediatorMock.Object);

        // Setup default anonymous user (no claims)
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    public class GetImages : SpeciesControllerTests
    {
        /// <summary>
        /// Verifies that a valid request returns 200 OK with a paginated result.
        /// </summary>
        [Fact]
        public async Task ValidRequest_ShouldReturnOkWithPaginatedResult()
        {
            // Arrange
            var speciesId = Guid.NewGuid();
            var images = new List<SpeciesImageDTO>
            {
                new(Guid.NewGuid(), speciesId, "https://example.com/img1.jpg", null, true, true, "CC-BY", DateTime.UtcNow),
                new(Guid.NewGuid(), speciesId, "https://example.com/img2.jpg", "https://example.com/thumb2.jpg", false, true, "CC-BY-SA", DateTime.UtcNow),
            };

            var paginatedResult = PaginatedResult<SpeciesImageDTO>.Create(images, 2, 1, 20);

            _mediatorMock.Setup(m => m.Send(It.IsAny<GetSpeciesImagesQuery>(), default))
                .ReturnsAsync(paginatedResult);

            // Act
            var result = await _controller.GetImages(speciesId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var value = okResult.Value.Should().BeOfType<PaginatedResult<SpeciesImageDTO>>().Subject;
            value.Items.Should().HaveCount(2);
            value.TotalCount.Should().Be(2);
            value.Page.Should().Be(1);
        }

        /// <summary>
        /// Verifies that a non-existing species ID request propagates NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExistingSpecies_ShouldThrowNotFoundException()
        {
            // Arrange
            var speciesId = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetSpeciesImagesQuery>(), default))
                .ThrowsAsync(new NotFoundException($"Species with id {speciesId} not found."));

            // Act
            var act = async () => await _controller.GetImages(speciesId);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }

        /// <summary>
        /// Verifies that the default filter value (onlyValidatedByExpert=true) is forwarded to the query.
        /// </summary>
        [Fact]
        public async Task DefaultParams_ShouldSendQueryWithDefaultValues()
        {
            // Arrange
            var speciesId = Guid.NewGuid();
            var emptyResult = PaginatedResult<SpeciesImageDTO>.Create(
                new List<SpeciesImageDTO>(), 0, 1, 20);

            _mediatorMock.Setup(m => m.Send(It.IsAny<GetSpeciesImagesQuery>(), default))
                .ReturnsAsync(emptyResult);

            // Act
            await _controller.GetImages(speciesId);

            // Assert — verify MediatR was called with default param values
            _mediatorMock.Verify(m => m.Send(
                It.Is<GetSpeciesImagesQuery>(q =>
                    q.SpeciesId == speciesId &&
                    q.OnlyValidatedByExpert == true &&
                    q.Page == 1 &&
                    q.PageSize == 20),
                default), Times.Once);
        }

        /// <summary>
        /// Verifies that custom query parameters are correctly forwarded to the MediatR query.
        /// </summary>
        [Fact]
        public async Task CustomParams_ShouldForwardToQuery()
        {
            // Arrange
            var speciesId = Guid.NewGuid();
            var emptyResult = PaginatedResult<SpeciesImageDTO>.Create(
                new List<SpeciesImageDTO>(), 0, 3, 10);

            _mediatorMock.Setup(m => m.Send(It.IsAny<GetSpeciesImagesQuery>(), default))
                .ReturnsAsync(emptyResult);

            // Act
            await _controller.GetImages(speciesId,
                onlyValidatedByExpert: false,
                page: 3,
                pageSize: 10);

            // Assert
            _mediatorMock.Verify(m => m.Send(
                It.Is<GetSpeciesImagesQuery>(q =>
                    q.SpeciesId == speciesId &&
                    q.OnlyValidatedByExpert == false &&
                    q.Page == 3 &&
                    q.PageSize == 10),
                default), Times.Once);
        }

        /// <summary>
        /// Verifies that an empty result still returns 200 OK with zero items.
        /// </summary>
        [Fact]
        public async Task EmptyResult_ShouldReturnOkWithEmptyItems()
        {
            // Arrange
            var speciesId = Guid.NewGuid();
            var emptyResult = PaginatedResult<SpeciesImageDTO>.Create(
                new List<SpeciesImageDTO>(), 0, 1, 20);

            _mediatorMock.Setup(m => m.Send(It.IsAny<GetSpeciesImagesQuery>(), default))
                .ReturnsAsync(emptyResult);

            // Act
            var result = await _controller.GetImages(speciesId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var value = okResult.Value.Should().BeOfType<PaginatedResult<SpeciesImageDTO>>().Subject;
            value.Items.Should().BeEmpty();
            value.TotalCount.Should().Be(0);
            value.HasNextPage.Should().BeFalse();
        }
    }
}
