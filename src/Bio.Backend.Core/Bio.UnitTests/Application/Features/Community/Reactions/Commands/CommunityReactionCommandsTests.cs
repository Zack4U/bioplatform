using Bio.Application.DTOs;
using Bio.Application.Features.Community.Reactions.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Community.Reactions.Commands;

public class CommunityReactionCommandsTests
{
    private readonly Mock<ICommunityReactionRepository> _reactionRepoMock = new();
    private readonly Mock<ICommunityPostRepository> _postRepoMock = new();
    private readonly Mock<ICommunityPostCommentRepository> _commentRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    private ToggleCommunityReactionCommandHandler CreateHandler()
        => new(_reactionRepoMock.Object, _postRepoMock.Object, _commentRepoMock.Object, _uowMock.Object);

    [Fact]
    public async Task ToggleReaction_OnPost_NewLike_ShouldIncrementAndAdd()
    {
        var postId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var post = new CommunityPost(Guid.NewGuid(), "T", "C", null);

        _postRepoMock.Setup(r => r.GetByIdAsync(postId, default)).ReturnsAsync(post);
        _reactionRepoMock.Setup(r => r.GetByUserAndTargetAsync(userId, "Post", postId, default))
            .ReturnsAsync((CommunityReaction?)null);

        var handler = CreateHandler();
        var result = await handler.Handle(
            new ToggleCommunityReactionCommand(
                new CommunityReactionToggleDTO { TargetType = "Post", TargetId = postId, ReactionType = "Like" },
                userId), default);

        result.Removed.Should().BeFalse();
        result.Changed.Should().BeFalse();
        result.CurrentReactionType.Should().Be("Like");
        result.LikesCount.Should().Be(1);
        _reactionRepoMock.Verify(r => r.AddAsync(It.IsAny<CommunityReaction>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task ToggleReaction_OnPost_SameLikeAgain_ShouldRemoveAndDecrement()
    {
        var postId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var post = new CommunityPost(Guid.NewGuid(), "T", "C", null);
        post.IncrementLikes();
        var existing = new CommunityReaction(userId, "Post", postId, "Like");

        _postRepoMock.Setup(r => r.GetByIdAsync(postId, default)).ReturnsAsync(post);
        _reactionRepoMock.Setup(r => r.GetByUserAndTargetAsync(userId, "Post", postId, default))
            .ReturnsAsync(existing);

        var handler = CreateHandler();
        var result = await handler.Handle(
            new ToggleCommunityReactionCommand(
                new CommunityReactionToggleDTO { TargetType = "Post", TargetId = postId, ReactionType = "Like" },
                userId), default);

        result.Removed.Should().BeTrue();
        result.LikesCount.Should().Be(0);
        _reactionRepoMock.Verify(r => r.DeleteAsync(existing, default), Times.Once);
    }

    [Fact]
    public async Task ToggleReaction_OnPost_ChangeLikeToDislike_ShouldChange()
    {
        var postId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var post = new CommunityPost(Guid.NewGuid(), "T", "C", null);
        post.IncrementLikes();
        var existing = new CommunityReaction(userId, "Post", postId, "Like");

        _postRepoMock.Setup(r => r.GetByIdAsync(postId, default)).ReturnsAsync(post);
        _reactionRepoMock.Setup(r => r.GetByUserAndTargetAsync(userId, "Post", postId, default))
            .ReturnsAsync(existing);

        var handler = CreateHandler();
        var result = await handler.Handle(
            new ToggleCommunityReactionCommand(
                new CommunityReactionToggleDTO { TargetType = "Post", TargetId = postId, ReactionType = "Dislike" },
                userId), default);

        result.Changed.Should().BeTrue();
        result.CurrentReactionType.Should().Be("Dislike");
        result.LikesCount.Should().Be(0);
        result.DislikesCount.Should().Be(1);
    }

    [Fact]
    public async Task ToggleReaction_InvalidTargetType_ShouldThrowValidationException()
    {
        var handler = CreateHandler();

        await FluentActions
            .Awaiting(() => handler.Handle(
                new ToggleCommunityReactionCommand(
                    new CommunityReactionToggleDTO { TargetType = "Product", TargetId = Guid.NewGuid(), ReactionType = "Like" },
                    Guid.NewGuid()), default))
            .Should().ThrowAsync<Bio.Domain.Exceptions.ValidationException>();
    }
}
