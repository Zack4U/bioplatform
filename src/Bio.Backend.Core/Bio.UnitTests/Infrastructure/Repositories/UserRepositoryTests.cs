using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Backend.Core.Bio.Infrastructure.Repositories;
using Bio.Domain.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Repositories;

/// <summary>
/// Unit tests for the <see cref="UserRepository"/> class.
/// Tests the persistence logic using an in-memory database.
/// </summary>
public class UserRepositoryTests : IDisposable
{
    private readonly BioDbContext _context;
    private readonly UserRepository _repository;

    public UserRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<BioDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new BioDbContext(options);
        _repository = new UserRepository(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task AddAsync_ShouldAddUserToDatabase()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "John Doe",
            Email = "john@example.com",
            PasswordHash = "hash",
            Salt = "salt"
        };

        // Act
        await _repository.AddAsync(user);
        await _repository.SaveChangesAsync();

        // Assert
        var savedUser = await _context.Users.FindAsync(user.Id);
        savedUser.Should().NotBeNull();
        savedUser!.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingUser_ShouldReturnUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            FullName = "Jane Doe",
            Email = "jane@example.com",
            PasswordHash = "hash",
            Salt = "salt"
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(userId);
    }

    [Fact]
    public async Task GetByEmailAsync_ExistingEmail_ShouldReturnUser()
    {
        // Arrange
        var email = "test@example.com";
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Test",
            Email = email,
            PasswordHash = "hash",
            Salt = "salt"
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByEmailAsync(email);

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be(email);
    }

    [Fact]
    public async Task DeleteAsync_ExistingUser_ShouldRemoveFromDatabase()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Delete Me",
            Email = "delete@example.com",
            PasswordHash = "hash",
            Salt = "salt"
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(user);
        await _repository.SaveChangesAsync();

        // Assert
        var deletedUser = await _context.Users.FindAsync(user.Id);
        deletedUser.Should().BeNull();
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllUsers()
    {
        // Arrange
        await _context.Users.AddAsync(new User { Id = Guid.NewGuid(), Email = "u1@test.com" });
        await _context.Users.AddAsync(new User { Id = Guid.NewGuid(), Email = "u2@test.com" });
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAllAsync();

        // Assert
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetByPhoneNumberAsync_ExistingPhone_ShouldReturnUser()
    {
        // Arrange
        var phone = "12345";
        var user = new User { Id = Guid.NewGuid(), Email = "t@t.com", PhoneNumber = phone };
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByPhoneNumberAsync(phone);

        // Assert
        result.Should().NotBeNull();
        result!.PhoneNumber.Should().Be(phone);
    }

    [Fact]
    public async Task GetByPhoneNumberAsync_NonExistingPhone_ShouldReturnNull()
    {
        // Act
        var result = await _repository.GetByPhoneNumberAsync("999");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByEmailExcludingIdAsync_ExistingOtherUser_ShouldReturnUser()
    {
        // Arrange
        var email = "other@test.com";
        var otherId = Guid.NewGuid();
        var currentId = Guid.NewGuid();
        await _context.Users.AddAsync(new User { Id = otherId, Email = email });
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByEmailExcludingIdAsync(email, currentId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(otherId);
    }

    [Fact]
    public async Task GetByEmailExcludingIdAsync_SameUser_ShouldReturnNull()
    {
        // Arrange
        var email = "same@test.com";
        var id = Guid.NewGuid();
        await _context.Users.AddAsync(new User { Id = id, Email = email });
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByEmailExcludingIdAsync(email, id);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByPhoneNumberExcludingIdAsync_ExistingOtherUser_ShouldReturnUser()
    {
        // Arrange
        var phone = "555";
        var otherId = Guid.NewGuid();
        var currentId = Guid.NewGuid();
        await _context.Users.AddAsync(new User { Id = otherId, Email = "o@o.com", PhoneNumber = phone });
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByPhoneNumberExcludingIdAsync(phone, currentId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(otherId);
    }

    [Fact]
    public async Task GetByPhoneNumberExcludingIdAsync_SameUser_ShouldReturnNull()
    {
        // Arrange
        var phone = "555";
        var id = Guid.NewGuid();
        await _context.Users.AddAsync(new User { Id = id, Email = "s@s.com", PhoneNumber = phone });
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByPhoneNumberExcludingIdAsync(phone, id);

        // Assert
        result.Should().BeNull();
    }
}
