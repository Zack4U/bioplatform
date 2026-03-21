using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Backend.Core.Bio.Infrastructure.Repositories;
using Bio.Domain.Entities;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Repositories;

/// <summary>
/// Unit tests for the <see cref="UserRoleRepository"/> class.
/// Tests the join logic and persistence of user-role assignments.
/// </summary>
public class UserRoleRepositoryTests : IDisposable
{
    protected readonly BioDbContext _context;
    protected readonly UserRoleRepository _repository;
    private readonly SqliteConnection? _connection;

    /// <summary>
    /// Initializes a new instance of the <see cref="UserRoleRepositoryTests"/> class.
    /// </summary>
    public UserRoleRepositoryTests() : this(useSqlite: false) { }

    /// <summary>
    /// Protected constructor to allow derived tests to specify the provider.
    /// SQLite is used to validate Composite Primary Key constraints.
    /// </summary>
    protected UserRoleRepositoryTests(bool useSqlite)
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

        _repository = new UserRoleRepository(_context);
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
    public class AddAsync : UserRoleRepositoryTests
    {
        /// <summary>
        /// Constructor for the nested class, using SQLite to validate Composite PK.
        /// </summary>
        public AddAsync() : base(useSqlite: true) { }

        /// <summary>
        /// Tests that a user-role assignment can be added.
        /// </summary>
        [Fact]
        public async Task ShouldAddUserRoleAssignment()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "U", "u@test.com", "h", "s");
            var role = new Role(Guid.NewGuid(), "R");
            await _context.Users.AddAsync(user);
            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();

            var userRole = new UserRole(user.Id, role.Id);

            // Act
            await _repository.AddAsync(userRole);
            await _context.SaveChangesAsync();

            // Assert
            var result = await _context.Set<UserRole>().FindAsync(user.Id, role.Id);
            result.Should().NotBeNull();
        }

        /// <summary>
        /// Negative Test: Tests that duplicate assignments (same UserId and RoleId) throw an exception.
        /// </summary>
        [Fact]
        public async Task DuplicateAssignment_ShouldThrowException()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "U", "u@test.com", "h", "s");
            var role = new Role(Guid.NewGuid(), "R");
            await _context.Users.AddAsync(user);
            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();

            var ur1 = new UserRole(user.Id, role.Id);
            var ur2 = new UserRole(user.Id, role.Id);

            await _repository.AddAsync(ur1);
            await _context.SaveChangesAsync();

            // Act - Use separate context to trigger DB-level PK violation
            var options = new DbContextOptionsBuilder<BioDbContext>()
                .UseSqlite(_context.Database.GetDbConnection())
                .Options;

            using var newContext = new BioDbContext(options);
            var newRepo = new UserRoleRepository(newContext);

            await newRepo.AddAsync(ur2);

            // Assert
            await Assert.ThrowsAsync<DbUpdateException>(() => newContext.SaveChangesAsync());
        }

        /// <summary>
        /// Negative Test: Tests that AddAsync throws ArgumentNullException when assignment is null.
        /// </summary>
        [Fact]
        public async Task NullAssignment_ShouldThrowException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.AddAsync(null!));
        }

        /// <summary>
        /// Negative Test: Tests that creating a UserRole with an empty UserId throws an ArgumentException.
        /// </summary>
        [Fact]
        public void EmptyUserId_ShouldThrowException()
        {
            // Act & Assert
            var action = () => new UserRole(Guid.Empty, Guid.NewGuid());
            action.Should().Throw<ArgumentException>().WithMessage("*User ID cannot be empty*");
        }

        /// <summary>
        /// Negative Test: Tests that creating a UserRole with an empty RoleId throws an ArgumentException.
        /// </summary>
        [Fact]
        public void EmptyRoleId_ShouldThrowException()
        {
            // Act & Assert
            var action = () => new UserRole(Guid.NewGuid(), Guid.Empty);
            action.Should().Throw<ArgumentException>().WithMessage("*Role ID cannot be empty*");
        }
    }

    /// <summary>
    /// Tests for the GetByUserIdWithDetailsAsync method.
    /// </summary>
    public class GetByUserIdWithDetailsAsync : UserRoleRepositoryTests
    {
        /// <summary>
        /// Tests that GetByUserIdWithDetailsAsync filters correctly by user.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnAssignments()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "U", "u@test.com", "h", "s");
            var role = new Role(Guid.NewGuid(), "R");
            await _context.Users.AddAsync(user);
            await _context.Roles.AddAsync(role);
            await _context.Set<UserRole>().AddAsync(new UserRole(user.Id, role.Id));
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByUserIdWithDetailsAsync(user.Id);

            // Assert
            result.Should().HaveCount(1);
            result.First().UserId.Should().Be(user.Id);
        }

        /// <summary>
        /// Tests that GetByUserIdWithDetailsAsync returns an empty collection when no assignments found.
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldReturnEmptyList()
        {
            // Act
            var result = await _repository.GetByUserIdWithDetailsAsync(Guid.NewGuid());

            // Assert
            result.Should().BeEmpty();
        }
    }

    /// <summary>
    /// Tests for the GetByRoleNameWithDetailsAsync method.
    /// </summary>
    public class GetByRoleNameWithDetailsAsync : UserRoleRepositoryTests
    {
        /// <summary>
        /// Tests that GetByRoleNameWithDetailsAsync filters correctly by role name.
        /// </summary>
        [Fact]
        public async Task ExistingRoleName_ShouldReturnAssignments()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "U", "u@test.com", "h", "s");
            var role = new Role(Guid.NewGuid(), "ROLE_TEST");
            await _context.Users.AddAsync(user);
            await _context.Roles.AddAsync(role);
            await _context.Set<UserRole>().AddAsync(new UserRole(user.Id, role.Id));
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByRoleNameWithDetailsAsync(role.Name);

            // Assert
            result.Should().HaveCount(1);
            result.First().RoleName.Should().Be(role.Name);
        }

        /// <summary>
        /// Tests that GetByRoleNameWithDetailsAsync returns an empty collection when no assignments found.
        /// </summary>
        [Fact]
        public async Task NonExistingRoleName_ShouldReturnEmptyList()
        {
            // Act
            var result = await _repository.GetByRoleNameWithDetailsAsync("NON_EXISTENT");

            // Assert
            result.Should().BeEmpty();
        }
    }

    /// <summary>
    /// Tests for the GetByRoleIdWithDetailsAsync method.
    /// </summary>
    public class GetByRoleIdWithDetailsAsync : UserRoleRepositoryTests
    {
        /// <summary>
        /// Tests that GetByRoleIdWithDetailsAsync filters correctly by role id.
        /// </summary>
        [Fact]
        public async Task ExistingRoleId_ShouldReturnAssignments()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "U", "u@test.com", "h", "s");
            var role = new Role(Guid.NewGuid(), "R");
            await _context.Users.AddAsync(user);
            await _context.Roles.AddAsync(role);
            await _context.Set<UserRole>().AddAsync(new UserRole(user.Id, role.Id));
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByRoleIdWithDetailsAsync(role.Id);

            // Assert
            result.Should().HaveCount(1);
            result.First().RoleId.Should().Be(role.Id);
        }

        /// <summary>
        /// Tests that GetByRoleIdWithDetailsAsync returns an empty collection when no assignments found.
        /// </summary>
        [Fact]
        public async Task NonExistingRoleId_ShouldReturnEmptyList()
        {
            // Act
            var result = await _repository.GetByRoleIdWithDetailsAsync(Guid.NewGuid());

            // Assert
            result.Should().BeEmpty();
        }
    }

    /// <summary>
    /// Tests for the ExistsAsync and GetByIdsAsync methods.
    /// </summary>
    public class UtilityMethods : UserRoleRepositoryTests
    {
        /// <summary>
        /// Tests ExistsAsync method.
        /// </summary>
        [Fact]
        public async Task ExistsAsync_ShouldReturnTrue_WhenExists()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "U", "u@test.com", "h", "s");
            var role = new Role(Guid.NewGuid(), "R");
            await _context.Users.AddAsync(user);
            await _context.Roles.AddAsync(role);
            await _context.Set<UserRole>().AddAsync(new UserRole(user.Id, role.Id));
            await _context.SaveChangesAsync();

            // Act
            var exists = await _repository.ExistsAsync(user.Id, role.Id);

            // Assert
            exists.Should().BeTrue();
        }

        /// <summary>
        /// Tests GetByIdsAsync method.
        /// </summary>
        [Fact]
        public async Task GetByIdsAsync_ShouldReturnEntity_WhenExists()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "U", "u@test.com", "h", "s");
            var role = new Role(Guid.NewGuid(), "R");
            await _context.Users.AddAsync(user);
            await _context.Roles.AddAsync(role);
            await _context.Set<UserRole>().AddAsync(new UserRole(user.Id, role.Id));
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByIdsAsync(user.Id, role.Id);

            // Assert
            result.Should().NotBeNull();
            result!.UserId.Should().Be(user.Id);
            result!.RoleId.Should().Be(role.Id);
        }
    }

    /// <summary>
    /// Tests for the DeleteAsync method.
    /// </summary>
    public class DeleteAsync : UserRoleRepositoryTests
    {
        public DeleteAsync() : base(useSqlite: true) { }

        /// <summary>
        /// Tests that an assignment can be deleted.
        /// </summary>
        [Fact]
        public async Task ShouldRemoveAssignment()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "U", "u@test.com", "h", "s");
            var role = new Role(Guid.NewGuid(), "R");
            await _context.Users.AddAsync(user);
            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();

            var ur = new UserRole(user.Id, role.Id);
            await _context.Set<UserRole>().AddAsync(ur);
            await _context.SaveChangesAsync();

            // Act
            await _repository.DeleteAsync(ur);
            await _context.SaveChangesAsync();

            // Assert
            var result = await _context.Set<UserRole>().FindAsync(ur.UserId, ur.RoleId);
            result.Should().BeNull();
        }

        /// <summary>
        /// Negative Test: Tests that DeleteAsync (via SaveChanges) throws exception if not found.
        /// </summary>
        [Fact]
        public async Task NonExistingAssignment_ShouldThrowException()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "U", "u@test.com", "h", "s");
            var role = new Role(Guid.NewGuid(), "R");
            await _context.Users.AddAsync(user);
            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();

            var ur = new UserRole(user.Id, role.Id);
            // We don't save 'ur' to the DB

            // Act
            await _repository.DeleteAsync(ur);

            // Assert
            await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => _context.SaveChangesAsync());
        }

        /// <summary>
        /// Negative Test: Tests that DeleteAsync throws ArgumentNullException when assignment is null.
        /// </summary>
        [Fact]
        public async Task NullAssignment_ShouldThrowException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _repository.DeleteAsync(null!));
        }
    }
}
