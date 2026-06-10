using Bio.Application.DTOs;
using Bio.Application.Features.Community.Posts.Commands;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Community.Posts.Commands;

public class CommunityPostCommandsTests
{
    private readonly Mock<ICommunityPostRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();
    private readonly Mock<ICacheService> _cacheMock = new();

    private static CommunityPost MakePost(Guid? authorId = null, string status = "Published")
    {
        var post = new CommunityPost(
            authorId ?? Guid.NewGuid(), "Test Title", "<p>Content</p>", "Biology");
        return post;
    }

    // ── CREATE ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task CreatePost_WhenValid_ShouldCreateAndReturn()
    {
        var handler = new CreateCommunityPostCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);
        var actorId = Guid.NewGuid();
        var dto = new CommunityPostCreateDTO
        {
            Title = "New Post",
            Content = "<p>Hello World</p>",
            Category = "Science"
        };

        var result = await handler.Handle(new CreateCommunityPostCommand(dto, actorId), default);

        result.Should().NotBeNull();
        result.Title.Should().Be("New Post");
        result.AuthorUserId.Should().Be(actorId);
        _repoMock.Verify(r => r.AddAsync(It.IsAny<CommunityPost>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    // ── UPDATE ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task UpdatePost_WhenAuthor_ShouldUpdate()
    {
        var actorId = Guid.NewGuid();
        var post = MakePost(actorId);
        _repoMock.Setup(r => r.GetByIdWithCommentsAsync(post.Id, default)).ReturnsAsync(post);

        var handler = new UpdateCommunityPostCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);
        var dto = new CommunityPostUpdateDTO { Title = "Updated" };

        var result = await handler.Handle(
            new UpdateCommunityPostCommand(post.Id, dto, actorId, RoleNames.Community), default);

        result.Title.Should().Be("Updated");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdatePost_WhenNotAuthorNotAdmin_ShouldThrowForbidden()
    {
        var post = MakePost();
        _repoMock.Setup(r => r.GetByIdWithCommentsAsync(post.Id, default)).ReturnsAsync(post);
        var handler = new UpdateCommunityPostCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new UpdateCommunityPostCommand(
                    post.Id, new CommunityPostUpdateDTO(), Guid.NewGuid(), RoleNames.Buyer), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdatePost_WhenAdminChangesStatus_ShouldSucceed()
    {
        var post = MakePost();
        _repoMock.Setup(r => r.GetByIdWithCommentsAsync(post.Id, default)).ReturnsAsync(post);
        var handler = new UpdateCommunityPostCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);

        var result = await handler.Handle(
            new UpdateCommunityPostCommand(
                post.Id, new CommunityPostUpdateDTO { Status = "Archived" },
                Guid.NewGuid(), RoleNames.Admin), default);

        result.Should().NotBeNull();
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdatePost_WhenNonAdminTriesToHide_ShouldThrowForbidden()
    {
        var actorId = Guid.NewGuid();
        var post = MakePost(actorId);
        _repoMock.Setup(r => r.GetByIdWithCommentsAsync(post.Id, default)).ReturnsAsync(post);
        var handler = new UpdateCommunityPostCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new UpdateCommunityPostCommand(
                    post.Id, new CommunityPostUpdateDTO { Status = "Hidden" },
                    actorId, RoleNames.Community), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeletePost_WhenAuthor_ShouldDelete()
    {
        var actorId = Guid.NewGuid();
        var post = MakePost(actorId);
        _repoMock.Setup(r => r.GetByIdAsync(post.Id, default)).ReturnsAsync(post);
        var handler = new DeleteCommunityPostCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);

        await handler.Handle(new DeleteCommunityPostCommand(post.Id, actorId, RoleNames.Community), default);

        _repoMock.Verify(r => r.DeleteAsync(post, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeletePost_WhenAdmin_ShouldDelete()
    {
        var post = MakePost();
        _repoMock.Setup(r => r.GetByIdAsync(post.Id, default)).ReturnsAsync(post);
        var handler = new DeleteCommunityPostCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);

        await handler.Handle(
            new DeleteCommunityPostCommand(post.Id, Guid.NewGuid(), RoleNames.Admin), default);

        _repoMock.Verify(r => r.DeleteAsync(post, default), Times.Once);
    }

    [Fact]
    public async Task DeletePost_WhenNotFound_ShouldThrowNotFound()
    {
        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync((CommunityPost?)null);
        var handler = new DeleteCommunityPostCommandHandler(_repoMock.Object, _uowMock.Object, _cacheMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new DeleteCommunityPostCommand(Guid.NewGuid(), Guid.NewGuid(), RoleNames.Admin), default))
            .Should().ThrowAsync<NotFoundException>();
    }

    // ── PIN / UNPIN ────────────────────────────────────────────────────────────

    [Fact]
    public async Task PinPost_ShouldPin()
    {
        var post = MakePost();
        _repoMock.Setup(r => r.GetByIdWithCommentsAsync(post.Id, default)).ReturnsAsync(post);
        var handler = new PinCommunityPostCommandHandler(_repoMock.Object, _uowMock.Object);

        var result = await handler.Handle(new PinCommunityPostCommand(post.Id, true), default);

        result.IsPinned.Should().BeTrue();
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
