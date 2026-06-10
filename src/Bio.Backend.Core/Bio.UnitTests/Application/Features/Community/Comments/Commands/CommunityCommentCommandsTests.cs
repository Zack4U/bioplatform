using Bio.Application.DTOs;
using Bio.Application.Features.Community.Comments.Commands;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Community.Comments.Commands;

public class CommunityCommentCommandsTests
{
    private readonly Mock<ICommunityPostCommentRepository> _repoMock = new();
    private readonly Mock<ICommunityPostRepository> _postRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    private static CommunityPost MakePublishedPost()
        => new(Guid.NewGuid(), "T", "<p>C</p>", null);

    private static CommunityPost MakeArchivedPost()
    {
        var p = new CommunityPost(Guid.NewGuid(), "T", "<p>C</p>", null);
        p.Update(null, null, null, "Archived");
        return p;
    }

    [Fact]
    public async Task CreateComment_WhenPostPublished_ShouldCreate()
    {
        var post = MakePublishedPost();
        _postRepoMock.Setup(r => r.GetByIdAsync(post.Id, default)).ReturnsAsync(post);

        var handler = new CreateCommunityCommentCommandHandler(
            _repoMock.Object, _postRepoMock.Object, _uowMock.Object);

        var result = await handler.Handle(
            new CreateCommunityCommentCommand(post.Id, new CommunityCommentCreateDTO { Content = "Nice!" }, Guid.NewGuid()), default);

        result.Should().NotBeNull();
        result.Content.Should().Be("Nice!");
        _repoMock.Verify(r => r.AddAsync(It.IsAny<CommunityPostComment>(), default), Times.Once);
    }

    [Fact]
    public async Task CreateComment_WhenPostArchived_ShouldThrowForbidden()
    {
        var post = MakeArchivedPost();
        _postRepoMock.Setup(r => r.GetByIdAsync(post.Id, default)).ReturnsAsync(post);

        var handler = new CreateCommunityCommentCommandHandler(
            _repoMock.Object, _postRepoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new CreateCommunityCommentCommand(
                    post.Id, new CommunityCommentCreateDTO { Content = "?" }, Guid.NewGuid()), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task DeleteComment_WhenAuthor_ShouldSoftDelete()
    {
        var authorId = Guid.NewGuid();
        var comment = new CommunityPostComment(Guid.NewGuid(), authorId, "Content");
        _repoMock.Setup(r => r.GetByIdAsync(comment.Id, default)).ReturnsAsync(comment);

        var handler = new DeleteCommunityCommentCommandHandler(_repoMock.Object, _uowMock.Object);
        await handler.Handle(
            new DeleteCommunityCommentCommand(comment.Id, authorId, RoleNames.Community), default);

        comment.IsDeleted.Should().BeTrue();
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeleteComment_WhenNotAuthorNotAdmin_ShouldThrowForbidden()
    {
        var comment = new CommunityPostComment(Guid.NewGuid(), Guid.NewGuid(), "Content");
        _repoMock.Setup(r => r.GetByIdAsync(comment.Id, default)).ReturnsAsync(comment);

        var handler = new DeleteCommunityCommentCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new DeleteCommunityCommentCommand(comment.Id, Guid.NewGuid(), RoleNames.Buyer), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdateComment_WhenAuthor_ShouldUpdate()
    {
        var authorId = Guid.NewGuid();
        var comment = new CommunityPostComment(Guid.NewGuid(), authorId, "Old");
        _repoMock.Setup(r => r.GetByIdAsync(comment.Id, default)).ReturnsAsync(comment);

        var handler = new UpdateCommunityCommentCommandHandler(_repoMock.Object, _uowMock.Object);
        var result = await handler.Handle(
            new UpdateCommunityCommentCommand(
                comment.Id, new CommunityCommentUpdateDTO { Content = "New" }, authorId, RoleNames.Community),
            default);

        result.Content.Should().Be("New");
    }
}
