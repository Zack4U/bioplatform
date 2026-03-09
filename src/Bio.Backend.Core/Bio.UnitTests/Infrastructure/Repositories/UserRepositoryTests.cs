using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Backend.Core.Bio.Infrastructure.Repositories;
using Bio.Domain.Entities;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Repositories;

/// <summary>
/// Unit tests for the <see cref="UserRepository"/> class.
/// Tests the persistence logic using either In-Memory or SQLite provider.
/// </summary>
public class UserRepositoryTests : IDisposable
{
    protected readonly BioDbContext _context;
    protected readonly UserRepository _repository;
    private readonly SqliteConnection? _connection;

    /// <summary>
    /// Initializes a new instance of the <see cref="UserRepositoryTests"/> class.
    /// Default setup uses In-Memory provider for speed.
    /// </summary>
    public UserRepositoryTests() : this(useSqlite: false) { }

    /// <summary>
    /// Protected constructor to allow derived tests (nested classes) to specify the provider.
    /// SQLite is used when database constraint validation (unique indexes, PKs) is required.
    /// </summary>
    protected UserRepositoryTests(bool useSqlite)
    {
        DbContextOptions<BioDbContext> options;

        if (useSqlite)
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            options = new DbContextOptionsBuilder<BioDbContext>()
                .UseSqlite(_connection)
                .Options;

            _context = new BioDbContext(options);
            _context.Database.EnsureCreated();
        }
        else
        {
            options = new DbContextOptionsBuilder<BioDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            
            _context = new BioDbContext(options);
        }

        _repository = new UserRepository(_context);
    }

    /// <summary>
    /// Disposes of the test context and connection.
    /// </summary>
    public void Dispose()
    {
        if (_connection != null)
        {
            _connection.Close();
            _connection.Dispose();
        }
        else
        {
            _context.Database.EnsureDeleted();
        }
        
        _context.Dispose();
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Tests for the AddAsync method.
    /// </summary>
    public class AddAsync : UserRepositoryTests
    {
        /// <summary>
        /// Constructor for the nested class, allowing it to use either provider.
        /// </summary>
        public AddAsync() : base(useSqlite: true) { }

        /// <summary>
        /// Tests that the AddAsync method adds a user to the database.
        /// </summary>
        [Fact]
        public async Task ShouldAddUserToDatabase()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "John Doe", "john@example.com", "hash", "salt");

            // Act
            await _repository.AddAsync(user);
            await _repository.SaveChangesAsync();

            // Assert
            var savedUser = await _context.Users.FindAsync(user.Id);
            savedUser.Should().NotBeNull();
            savedUser!.Email.Should().Be(user.Email);
        }

        /// <summary>
        /// Negative Test: Tests that AddAsync throws ArgumentNullException when user is null.
        /// </summary>
        [Fact]
        public async Task ShouldThrowException_When_UserIsNull()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.AddAsync(null!));
        }

        /// <summary>
        /// Negative Test: Tests that saving throws an exception when the ID is duplicated.
        /// </summary>
        [Fact]
        public async Task DuplicateId_ShouldThrowException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var user1 = new User(id, "User 1", "u1@test.com", "h", "s");
            var user2 = new User(id, "User 1 Duplicate", "u1_dup@test.com", "h", "s");

            await _repository.AddAsync(user1);
            await _repository.SaveChangesAsync();

            // Act - Use a new context and repository instance to avoid tracking conflicts
            // but keep the same underlying SQLite connection
            var options = new DbContextOptionsBuilder<BioDbContext>()
                .UseSqlite(_context.Database.GetDbConnection())
                .Options;

            using var newContext = new BioDbContext(options);
            var newRepository = new UserRepository(newContext);

            await newRepository.AddAsync(user2);
            
            // Assert
            await Assert.ThrowsAsync<DbUpdateException>(() => newRepository.SaveChangesAsync());
        }

        /// <summary>
        /// Negative Test: Tests that saving throws an exception when the Email is duplicated.
        /// </summary>
        [Fact]
        public async Task DuplicateEmail_ShouldThrowException()
        {
            // Arrange
            var email = "duplicate@test.com";
            var user1 = new User(Guid.NewGuid(), "User 1", email, "h", "s");
            var user2 = new User(Guid.NewGuid(), "User 2", email, "h", "s");

            await _repository.AddAsync(user1);
            await _repository.SaveChangesAsync();

            // Act
            await _repository.AddAsync(user2);
            
            // Assert
            await Assert.ThrowsAsync<DbUpdateException>(() => _repository.SaveChangesAsync());
        }

        /// <summary>
        /// Negative Test: Tests that saving throws an exception when the PhoneNumber is duplicated.
        /// </summary>
        [Fact]
        public async Task DuplicatePhoneNumber_ShouldThrowException()
        {
            // Arrange
            var phone = "123456789";
            var user1 = new User(Guid.NewGuid(), "User 1", "u1@test.com", "h", "s", phone);
            var user2 = new User(Guid.NewGuid(), "User 2", "u2@test.com", "h", "s", phone);

            await _repository.AddAsync(user1);
            await _repository.SaveChangesAsync();

            // Act
            await _repository.AddAsync(user2);
            
            // Assert
            await Assert.ThrowsAsync<DbUpdateException>(() => _repository.SaveChangesAsync());
        }
    }

    /// <summary>
    /// Tests for the GetByIdAsync method.
    /// </summary>
    public class GetByIdAsync : UserRepositoryTests
    {
        /// <summary>
        /// Tests that the GetByIdAsync method returns a user by ID.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Jane Doe", "jane@example.com", "hash", "salt");

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(userId);
        }

        /// <summary>
        /// Tests that GetByIdAsync returns null when the user does not exist.
        /// </summary>
        [Fact]
        public async Task NonExistingId_ShouldReturnNull()
        {
            // Act
            var result = await _repository.GetByIdAsync(Guid.NewGuid());

            // Assert
            result.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the GetByEmailAsync method.
    /// </summary>
    public class GetByEmailAsync : UserRepositoryTests
    {
        /// <summary>
        /// Tests that the GetByEmailAsync method returns a user by email.
        /// </summary>
        [Fact]
        public async Task ExistingEmail_ShouldReturnUser()
        {
            // Arrange
            var email = "test@example.com";
            var user = new User(Guid.NewGuid(), "Test", email, "hash", "salt");

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByEmailAsync(email);

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be(email);
        }

        /// <summary>
        /// Tests that GetByEmailAsync returns null when the email does not exist.
        /// </summary>
        [Fact]
        public async Task NonExistingEmail_ShouldReturnNull()
        {
            // Act
            var result = await _repository.GetByEmailAsync("nonexisting@example.com");

            // Assert
            result.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the GetByPhoneNumberAsync method.
    /// </summary>
    public class GetByPhoneNumberAsync : UserRepositoryTests
    {
        /// <summary>
        /// Tests that the GetByPhoneNumberAsync method returns a user by phone number.
        /// </summary>
        [Fact]
        public async Task ExistingPhone_ShouldReturnUser()
        {
            // Arrange
            var phone = "12345";
            var user = new User(Guid.NewGuid(), "T", "t@t.com", "h", "s", phone);
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByPhoneNumberAsync(phone);

            // Assert
            result.Should().NotBeNull();
            result!.PhoneNumber.Should().Be(phone);
        }

        /// <summary>
        /// Tests that the GetByPhoneNumberAsync method returns null when the phone number does not exist.
        /// </summary>
        [Fact]
        public async Task NonExistingPhone_ShouldReturnNull()
        {
            // Act
            var result = await _repository.GetByPhoneNumberAsync("999");

            // Assert
            result.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the GetAllAsync method.
    /// </summary>
    public class GetAllAsync : UserRepositoryTests
    {
        /// <summary>
        /// Tests that the GetAllAsync method returns all users.
        /// </summary>
        [Fact]
        public async Task ShouldReturnAllUsers()
        {
            // Arrange
            await _context.Users.AddAsync(new User(Guid.NewGuid(), "U1", "u1@test.com", "h", "s"));
            await _context.Users.AddAsync(new User(Guid.NewGuid(), "U2", "u2@test.com", "h", "s"));
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetAllAsync();

            // Assert
            result.Should().HaveCount(2);
        }

        /// <summary>
        /// Tests that the GetAllAsync method returns an empty collection when the database is empty.
        /// </summary>
        [Fact]
        public async Task EmptyDatabase_ShouldReturnEmptyList()
        {
            // Act
            var result = await _repository.GetAllAsync();

            // Assert
            result.Should().BeEmpty();
        }
    }

    /// <summary>
    /// Tests for the GetByEmailExcludingIdAsync method.
    /// </summary>
    public class GetByEmailExcludingIdAsync : UserRepositoryTests
    {
        /// <summary>
        /// Tests that the GetByEmailExcludingIdAsync method returns a user by email excluding a specific ID.
        /// </summary>
        [Fact]
        public async Task ExistingOtherUser_ShouldReturnUser()
        {
            // Arrange
            var email = "other@test.com";
            var otherId = Guid.NewGuid();
            var currentId = Guid.NewGuid();
            await _context.Users.AddAsync(new User(otherId, "Other", email, "h", "s"));
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByEmailExcludingIdAsync(email, currentId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(otherId);
        }

        /// <summary>
        /// Tests that the GetByEmailExcludingIdAsync method returns null when the email does not exist.
        /// </summary>
        [Fact]
        public async Task SameUser_ShouldReturnNull()
        {
            // Arrange
            var email = "same@test.com";
            var id = Guid.NewGuid();
            await _context.Users.AddAsync(new User(id, "Same", email, "h", "s"));
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByEmailExcludingIdAsync(email, id);

            // Assert
            result.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the GetByPhoneNumberExcludingIdAsync method.
    /// </summary>
    public class GetByPhoneNumberExcludingIdAsync : UserRepositoryTests
    {
        /// <summary>
        /// Tests that the GetByPhoneNumberExcludingIdAsync method returns a user by phone number excluding a specific ID.
        /// </summary>
        [Fact]
        public async Task ExistingOtherUser_ShouldReturnUser()
        {
            // Arrange
            var phone = "555";
            var otherId = Guid.NewGuid();
            var currentId = Guid.NewGuid();
            await _context.Users.AddAsync(new User(otherId, "O", "o@o.com", "h", "s", phone));
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByPhoneNumberExcludingIdAsync(phone, currentId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(otherId);
        }

        /// <summary>
        /// Tests that the GetByPhoneNumberExcludingIdAsync method returns null when the phone number does not exist.
        /// </summary>
        [Fact]
        public async Task SameUser_ShouldReturnNull()
        {
            // Arrange
            var phone = "555";
            var id = Guid.NewGuid();
            await _context.Users.AddAsync(new User(id, "S", "s@s.com", "h", "s", phone));
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByPhoneNumberExcludingIdAsync(phone, id);

            // Assert
            result.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the DeleteAsync method.
    /// </summary>
    public class DeleteAsync : UserRepositoryTests
    {
        /// <summary>
        /// Tests that the DeleteAsync method removes a user from the database.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldRemoveFromDatabase()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "Delete Me", "delete@example.com", "hash", "salt");

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            await _repository.DeleteAsync(user);
            await _repository.SaveChangesAsync();

            // Assert
            var deletedUser = await _context.Users.FindAsync(user.Id);
            deletedUser.Should().BeNull();
        }

        /// <summary>
        /// Negative Test: Tests that DeleteAsync (via SaveChanges) throws an exception if the user does not exist in the database.
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldThrowException()
        {
            // Arrange - Create a user but don't save it to the DB
            var user = new User(Guid.NewGuid(), "Non Existing", "non@test.com", "h", "s");

            // Act
            await _repository.DeleteAsync(user);

            // Assert - EF Core throws DbUpdateConcurrencyException when it expects to delete 1 row but deletes 0
            await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => _repository.SaveChangesAsync());
        }

        /// <summary>
        /// Negative Test: Tests that DeleteAsync throws ArgumentNullException when user is null.
        /// </summary>
        [Fact]
        public async Task NullUser_ShouldThrowException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.DeleteAsync(null!));
        }
    }
}
