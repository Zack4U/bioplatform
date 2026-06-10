using Bio.Application.DTOs;
using Bio.Application.Features.Favorites.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Favorites.Commands;

public class FavoriteCommandsTests
{
    private readonly Mock<IFavoriteRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    [Fact]
    public async Task AddFavorite_WhenValid_ShouldCreate()
    {
        var userId = Guid.NewGuid();
        var targetId = Guid.NewGuid();
        var dto = new FavoriteCreateDTO("PRODUCT", targetId);

        _repoMock.Setup(r => r.ExistsAsync(userId, "PRODUCT", targetId, default)).ReturnsAsync(false);

        var handler = new AddFavoriteCommandHandler(_repoMock.Object, _uowMock.Object);
        var result = await handler.Handle(new AddFavoriteCommand(dto, userId), default);

        result.Should().NotBeNull();
        result.TargetType.Should().Be("PRODUCT");
        _repoMock.Verify(r => r.AddAsync(It.IsAny<Favorite>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task AddFavorite_WhenAlreadyExists_ShouldThrowConflict()
    {
        var userId = Guid.NewGuid();
        var targetId = Guid.NewGuid();
        var dto = new FavoriteCreateDTO("PRODUCT", targetId);

        _repoMock.Setup(r => r.ExistsAsync(userId, "PRODUCT", targetId, default)).ReturnsAsync(true);

        var handler = new AddFavoriteCommandHandler(_repoMock.Object, _uowMock.Object);
        await FluentActions.Awaiting(() => handler.Handle(new AddFavoriteCommand(dto, userId), default))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task RemoveFavorite_WhenValid_ShouldDelete()
    {
        var favoriteId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var targetId = Guid.NewGuid();
        var favorite = new Favorite(userId, "PRODUCT", targetId);

        _repoMock.Setup(r => r.GetByIdAsync(favoriteId, default)).ReturnsAsync(favorite);

        var handler = new RemoveFavoriteCommandHandler(_repoMock.Object, _uowMock.Object);
        await handler.Handle(new RemoveFavoriteCommand(favoriteId, userId), default);

        _repoMock.Verify(r => r.DeleteAsync(favorite, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task RemoveFavorite_WhenNotOwner_ShouldThrowForbidden()
    {
        var favoriteId = Guid.NewGuid();
        var favorite = new Favorite(Guid.NewGuid(), "PRODUCT", Guid.NewGuid());

        _repoMock.Setup(r => r.GetByIdAsync(favoriteId, default)).ReturnsAsync(favorite);

        var handler = new RemoveFavoriteCommandHandler(_repoMock.Object, _uowMock.Object);
        await FluentActions.Awaiting(() => handler.Handle(new RemoveFavoriteCommand(favoriteId, Guid.NewGuid()), default))
            .Should().ThrowAsync<ForbiddenException>();
    }
}
