using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="ChatMessage"/> domain entity.
/// </summary>
public class ChatMessageTests
{
    private static readonly Guid SessionId = Guid.NewGuid();
    private const string Role = "user";
    private const string Content = "Hello, assistant!";

    /// <summary>
    /// Tests for the initialization of the ChatMessage entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a ChatMessage is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var message = new ChatMessage(SessionId, Role, Content);

            // Assert
            message.Id.Should().NotBeEmpty();
            message.SessionId.Should().Be(SessionId);
            message.Role.Should().Be(Role);
            message.Content.Should().Be(Content);
            message.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }
    }
}
