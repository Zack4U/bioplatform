using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Backend.Core.Bio.Infrastructure.Repositories;
using Bio.Domain.Entities;
using Bio.Domain.Constants;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Repositories;

/// <summary>
/// Unit tests for the <see cref="RoleRepository"/> class.
/// Tests the persistence logic using either In-Memory or SQLite provider.
/// </summary>
public class RoleRepositoryTests : IDisposable
{
    protected readonly BioDbContext _context;
    protected readonly RoleRepository _repository;
    private readonly SqliteConnection? _connection;

    /// <summary>
    /// Initializes a new instance of the <see cref="RoleRepositoryTests"/> class.
    /// Default setup uses In-Memory provider for speed.
    /// </summary>
    public RoleRepositoryTests() : this(useSqlite: false) { }

    /// <summary>
    /// Protected constructor to allow derived tests (nested classes) to specify the provider.
    /// SQLite is used when database constraint validation (unique indexes, PKs) is required.
    /// </summary>
    protected RoleRepositoryTests(bool useSqlite)
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

        _repository = new RoleRepository(_context);
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
    public class AddAsync : RoleRepositoryTests
    {
        /// <summary>
        /// Constructor for the nested class, using SQLite to validate constraints.
        /// </summary>
        public AddAsync() : base(useSqlite: true) { }

        /// <summary>
        /// Tests that the AddAsync method adds a role to the database.
        /// </summary>
        [Fact]
        public async Task ShouldAddRoleToDatabase()
        {
            // Arrange
            var role = new Role(Guid.NewGuid(), "Admin");

            // Act
            await _repository.AddAsync(role);
            await _context.SaveChangesAsync();

            // Assert
            var savedRole = await _context.Roles.FindAsync(role.Id);
            savedRole.Should().NotBeNull();
            savedRole!.Name.Should().Be(RoleNames.Admin);
        }

        /// <summary>
        /// Negative Test: Tests that AddAsync throws ArgumentNullException when role is null.
        /// </summary>
        [Fact]
        public async Task ShouldThrowException_When_RoleIsNull()
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
            var role1 = new Role(id, "ROLE 1");
            var role2 = new Role(id, "ROLE 2");

            await _repository.AddAsync(role1);
            await _context.SaveChangesAsync();

            // Act - Use a new context to bypass EF tracking and trigger DB PK constraint
            var options = new DbContextOptionsBuilder<BioDbContext>()
                .UseSqlite(_context.Database.GetDbConnection())
                .Options;

            using var newContext = new BioDbContext(options);
            var newRepository = new RoleRepository(newContext);

            await newRepository.AddAsync(role2);

            // Assert
            await Assert.ThrowsAsync<DbUpdateException>(() => newContext.SaveChangesAsync());
        }

        /// <summary>
        /// Negative Test: Tests that saving throws an exception when the Name is duplicated.
        /// </summary>
        [Fact]
        public async Task DuplicateName_ShouldThrowException()
        {
            // Arrange
            var commonName = "Admin";
            var role1 = new Role(Guid.NewGuid(), commonName);
            var role2 = new Role(Guid.NewGuid(), commonName);

            await _repository.AddAsync(role1);
            await _context.SaveChangesAsync();

            // Act
            await _repository.AddAsync(role2);

            // Assert
            await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        }
    }

    /// <summary>
    /// Tests for the GetByIdAsync method.
    /// </summary>
    public class GetByIdAsync : RoleRepositoryTests
    {
        /// <summary>
        /// Tests that GetByIdAsync returns a role by its unique identifier.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnRole()
        {
            // Arrange
            var id = Guid.NewGuid();
            var role = new Role(id, "User");
            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByIdAsync(id);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(id);
        }

        /// <summary>
        /// Tests that GetByIdAsync returns null when the role does not exist.
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
    /// Tests for the GetByNameAsync method.
    /// </summary>
    public class GetByNameAsync : RoleRepositoryTests
    {
        /// <summary>
        /// Tests that GetByNameAsync returns a role by its unique name.
        /// </summary>
        [Fact]
        public async Task ExistingName_ShouldReturnRole()
        {
            // Arrange
            var name = "Manager";
            var role = new Role(Guid.NewGuid(), name);
            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByNameAsync(name.ToUpperInvariant());

            // Assert
            result.Should().NotBeNull();
            result!.Name.Should().Be(name.ToUpperInvariant());
        }

        /// <summary>
        /// Tests that GetByNameAsync returns null when the name does not exist.
        /// </summary>
        [Fact]
        public async Task NonExistingName_ShouldReturnNull()
        {
            // Act
            var result = await _repository.GetByNameAsync("NonExistingName");

            // Assert
            result.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the GetByNameExcludingIdAsync method.
    /// </summary>
    public class GetByNameExcludingIdAsync : RoleRepositoryTests
    {
        /// <summary>
        /// Tests that it returns a role when the name belongs to a different ID.
        /// </summary>
        [Fact]
        public async Task ExistingName_OtherRole_ShouldReturnRole()
        {
            // Arrange
            var name = "Technician";
            var role1 = new Role(Guid.NewGuid(), name);
            var id2 = Guid.NewGuid();

            await _context.Roles.AddAsync(role1);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByNameExcludingIdAsync(name.ToUpperInvariant(), id2);

            // Assert
            result.Should().NotBeNull();
            result!.Name.Should().Be(name.ToUpperInvariant());
        }

        /// <summary>
        /// Tests that it returns null when the name belongs to the excluded ID.
        /// </summary>
        [Fact]
        public async Task SameRole_ShouldReturnNull()
        {
            // Arrange
            var name = "Supervisor";
            var id = Guid.NewGuid();
            var role = new Role(id, name);

            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByNameExcludingIdAsync(name.ToUpperInvariant(), id);

            // Assert
            result.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the GetAllAsync method.
    /// </summary>
    public class GetAllAsync : RoleRepositoryTests
    {
        /// <summary>
        /// Tests that the GetAllAsync method returns all roles.
        /// </summary>
        [Fact]
        public async Task ShouldReturnAllRoles()
        {
            // Arrange
            await _context.Roles.AddAsync(new Role(Guid.NewGuid(), "Role1"));
            await _context.Roles.AddAsync(new Role(Guid.NewGuid(), "Role2"));
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
    /// Tests for the DeleteAsync method.
    /// </summary>
    public class DeleteAsync : RoleRepositoryTests
    {
        /// <summary>
        /// Tests that the DeleteAsync method removes a role from the database.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldRemoveFromDatabase()
        {
            // Arrange
            var role = new Role(Guid.NewGuid(), "DeleteMe");
            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();

            // Act
            await _repository.DeleteAsync(role);
            await _context.SaveChangesAsync();

            // Assert
            var deletedRole = await _context.Roles.FindAsync(role.Id);
            deletedRole.Should().BeNull();
        }

        /// <summary>
        /// Negative Test: Tests that DeleteAsync (via SaveChanges) throws an exception if the role does not exist.
        /// </summary>
        [Fact]
        public async Task NonExistingRole_ShouldThrowException()
        {
            // Arrange
            var role = new Role(Guid.NewGuid(), "NonExisting");

            // Act
            await _repository.DeleteAsync(role);

            // Assert
            await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => _context.SaveChangesAsync());
        }

        /// <summary>
        /// Negative Test: Tests that DeleteAsync throws ArgumentNullException when role is null.
        /// </summary>
        [Fact]
        public async Task NullRole_ShouldThrowException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.DeleteAsync(null!));
        }
    }
}
