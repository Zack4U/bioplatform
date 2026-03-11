using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Backend.Core.Bio.Infrastructure.Repositories;
using Bio.Domain.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Repositories;

/// <summary>
/// Unit tests for the <see cref="RefreshTokenRepository"/> class.
/// Tests the persistence logic using an In-Memory provider.
/// </summary>
public class RefreshTokenRepositoryTests : IDisposable
{
    private readonly BioDbContext _context;
    private readonly RefreshTokenRepository _repository;

    /// <summary>
    /// Initializes a new instance of the <see cref="RefreshTokenRepositoryTests"/> class.
    /// Sets up a fresh In-Memory database for each test to ensure isolation.
    /// </summary>
    public RefreshTokenRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<BioDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new BioDbContext(options);
        _repository = new RefreshTokenRepository(_context);
    }

    /// <summary>
    /// Disposes of the test context and deletes the in-memory database to free resources.
    /// </summary>
    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Tests for the AddAsync method.
    /// </summary>
    public class AddAsync : RefreshTokenRepositoryTests
    {
        /// <summary>
        /// Tests that the AddAsync method successfully adds a RefreshToken to the database.
        /// </summary>
        [Fact]
        public async Task ShouldAddRefreshTokenToDatabase()
        {
            // Arrange
            var tokenString = "super_secure_token";
            var refreshToken = new RefreshToken(Guid.NewGuid(), tokenString, DateTime.UtcNow.AddDays(7));

            // Act
            await _repository.AddAsync(refreshToken);
            await _repository.SaveChangesAsync();

            // Assert
            var savedToken = await _context.RefreshTokens.FindAsync(refreshToken.Id);
            savedToken.Should().NotBeNull();
            savedToken!.Token.Should().Be(tokenString);
        }

        /// <summary>
        /// Negative Test: Tests that AddAsync throws ArgumentNullException when token is null.
        /// </summary>
        [Fact]
        public async Task ShouldThrowException_When_TokenIsNull()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.AddAsync(null!));
        }
    }

    /// <summary>
    /// Tests for the GetByTokenAsync(string token) method overload.
    /// </summary>
    public class GetByTokenAsync_StringOnly : RefreshTokenRepositoryTests
    {
        /// <summary>
        /// Tests that it returns a RefreshToken when the token string matches an existing record.
        /// </summary>
        [Fact]
        public async Task ExistingToken_ShouldReturnRefreshToken()
        {
            // Arrange
            var tokenString = "existing_token_abc123";
            var refreshToken = new RefreshToken(Guid.NewGuid(), tokenString, DateTime.UtcNow.AddDays(7));

            await _context.RefreshTokens.AddAsync(refreshToken);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByTokenAsync(tokenString);

            // Assert
            result.Should().NotBeNull();
            result!.Token.Should().Be(tokenString);
            result.Id.Should().Be(refreshToken.Id);
        }

        /// <summary>
        /// Tests that it returns null when the token string does not exist in the database.
        /// </summary>
        [Fact]
        public async Task NonExistingToken_ShouldReturnNull()
        {
            // Act
            var result = await _repository.GetByTokenAsync("non_existing_token");

            // Assert
            result.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the GetByTokenAsync(string token, Guid userId) method overload.
    /// </summary>
    public class GetByTokenAsync_StringAndUserId : RefreshTokenRepositoryTests
    {
        /// <summary>
        /// Tests that it returns a RefreshToken when both the token string and the user ID match.
        /// </summary>
        [Fact]
        public async Task ExistingTokenAndUserId_ShouldReturnRefreshToken()
        {
            // Arrange
            var tokenString = "user_specific_token";
            var userId = Guid.NewGuid();
            var refreshToken = new RefreshToken(userId, tokenString, DateTime.UtcNow.AddDays(7));

            await _context.RefreshTokens.AddAsync(refreshToken);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByTokenAsync(tokenString, userId);

            // Assert
            result.Should().NotBeNull();
            result!.Token.Should().Be(tokenString);
            result.UserId.Should().Be(userId);
        }

        /// <summary>
        /// Tests that it returns null when the token exists but the user ID does not match.
        /// </summary>
        [Fact]
        public async Task ExistingToken_DifferentUserId_ShouldReturnNull()
        {
            // Arrange
            var tokenString = "user_specific_token";
            var initialUserId = Guid.NewGuid();
            var differentUserId = Guid.NewGuid(); // Mismatch

            var refreshToken = new RefreshToken(initialUserId, tokenString, DateTime.UtcNow.AddDays(7));
            await _context.RefreshTokens.AddAsync(refreshToken);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByTokenAsync(tokenString, differentUserId);

            // Assert
            result.Should().BeNull();
        }

        /// <summary>
        /// Tests that it returns null when the token does not exist, even if the user ID is somehow provided.
        /// </summary>
        [Fact]
        public async Task NonExistingToken_ShouldReturnNull()
        {
            // Act
            var result = await _repository.GetByTokenAsync("ghost_token", Guid.NewGuid());

            // Assert
            result.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the UpdateAsync method.
    /// </summary>
    public class UpdateAsync : RefreshTokenRepositoryTests
    {
        /// <summary>
        /// Tests that updating a refresh token (revoking it without replacement) successfully persists the revocation state.
        /// </summary>
        [Fact]
        public async Task UpdateAsync_ShouldSaveRevocationStatus_WhenRevoked()
        {
            // Arrange
            var refreshToken = new RefreshToken(Guid.NewGuid(), "update_test_token_1", DateTime.UtcNow.AddDays(7));
            await _context.RefreshTokens.AddAsync(refreshToken);
            await _context.SaveChangesAsync();

            // Act - Modify the tracked entity
            refreshToken.Revoke(); // Revoke without replacing

            await _repository.UpdateAsync(refreshToken);
            await _repository.SaveChangesAsync();

            // Assert - Read fresh from DB
            var updatedToken = await _context.RefreshTokens.FindAsync(refreshToken.Id);

            updatedToken.Should().NotBeNull();
            updatedToken!.IsRevoked.Should().BeTrue();
            updatedToken.RevokedAt.Should().NotBeNull();
            updatedToken.ReplacedByToken.Should().BeNull();
        }

        /// <summary>
        /// Tests that updating a refresh token with a replacement successfully persists the new token reference.
        /// </summary>
        [Fact]
        public async Task UpdateAsync_ShouldSaveReplacedByToken_WhenReplacementIsProvided()
        {
            // Arrange
            var refreshToken = new RefreshToken(Guid.NewGuid(), "update_test_token_2", DateTime.UtcNow.AddDays(7));
            await _context.RefreshTokens.AddAsync(refreshToken);
            await _context.SaveChangesAsync();

            // Act - Modify the tracked entity
            string expectedReplacement = "replacement_token";
            refreshToken.Revoke(expectedReplacement); // Revoke passing a replacement

            await _repository.UpdateAsync(refreshToken);
            await _repository.SaveChangesAsync();

            // Assert - Read fresh from DB
            var updatedToken = await _context.RefreshTokens.FindAsync(refreshToken.Id);

            updatedToken.Should().NotBeNull();
            updatedToken!.IsRevoked.Should().BeTrue();
            updatedToken.RevokedAt.Should().NotBeNull();
            updatedToken.ReplacedByToken.Should().Be(expectedReplacement);
        }
    }
}
