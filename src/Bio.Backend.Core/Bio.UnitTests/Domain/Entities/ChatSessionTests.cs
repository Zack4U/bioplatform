using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="ChatSession"/> domain entity.
/// </summary>
public class ChatSessionTests
{
    private static readonly Guid UserId = Guid.NewGuid();
    private const string ContextTopic = "Species identification";

    /// <summary>
    /// Tests for the initialization of the ChatSession entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a ChatSession is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var session = new ChatSession(UserId, ContextTopic);

            // Assert
            session.Id.Should().NotBeEmpty();
            session.UserId.Should().Be(UserId);
            session.ContextTopic.Should().Be(ContextTopic);
            session.StartedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            session.Messages.Should().BeEmpty();
        }
    }
}
