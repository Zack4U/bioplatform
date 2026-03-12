using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Moq;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Persistence;

/// <summary>
/// Unit tests for the <see cref="UnitOfWork"/> class.
/// </summary>
public class UnitOfWorkTests
{
    private readonly Mock<BioDbContext> _contextMock;
    private readonly UnitOfWork _unitOfWork;

    public UnitOfWorkTests()
    {
        // Setup DbContext options for Mocking
        var options = new DbContextOptionsBuilder<BioDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _contextMock = new Mock<BioDbContext>(options);
        _unitOfWork = new UnitOfWork(_contextMock.Object);
    }

    /// <summary>
    /// Tests related to the constructor and initialization.
    /// </summary>
    public class ConstructorTests : UnitOfWorkTests
    {
        /// <summary>
        /// Tests that the constructor initializes the UnitOfWork correctly.
        /// </summary>
        [Fact]
        public void Constructor_ShouldInitializeCorrectly()
        {
            // Assert
            _unitOfWork.Should().NotBeNull();
        }
    }

    /// <summary>
    /// Tests for the SaveChangesAsync method.
    /// </summary>
    public class SaveChangesAsyncTests : UnitOfWorkTests
    {
        /// <summary>
        /// Tests that the SaveChangesAsync method calls the context's SaveChangesAsync method.
        /// </summary>
        [Fact]
        public async Task SaveChangesAsync_ShouldCallContextSaveChangesAsync()
        {
            // Arrange
            var cancellationToken = CancellationToken.None;
            _contextMock.Setup(c => c.SaveChangesAsync(cancellationToken))
                .ReturnsAsync(1);

            // Act
            var result = await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Assert
            result.Should().Be(1);
            _contextMock.Verify(c => c.SaveChangesAsync(cancellationToken), Times.Once);
        }
    }

    /// <summary>
    /// Tests for transaction management (Begin, Commit, Rollback).
    /// </summary>
    public class TransactionTests : UnitOfWorkTests
    {
        private readonly Mock<IDbContextTransaction> _transactionMock;

        /// <summary>
        /// Initializes a new instance of the <see cref="TransactionTests"/> class.
        /// </summary>
        public TransactionTests()
        {
            _transactionMock = new Mock<IDbContextTransaction>();

            // Setup Database and Transaction Mocking
            var databaseMock = new Mock<Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade>(_contextMock.Object);
            _contextMock.Setup(c => c.Database).Returns(databaseMock.Object);

            databaseMock.Setup(d => d.BeginTransactionAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(_transactionMock.Object);
        }

        /// <summary>
        /// Tests that the BeginTransactionAsync method starts a new transaction.
        /// </summary>
        [Fact]
        public async Task BeginTransactionAsync_ShouldStartNewTransaction()
        {
            // Act
            await _unitOfWork.BeginTransactionAsync();

            // Assert
            Mock.Get(_contextMock.Object.Database).Verify(d => d.BeginTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// Tests that the CommitTransactionAsync method commits the transaction when a transaction exists.
        /// </summary>
        [Fact]
        public async Task CommitTransactionAsync_ShouldCommitTransaction_WhenTransactionExists()
        {
            // Arrange
            await _unitOfWork.BeginTransactionAsync();

            // Act
            await _unitOfWork.CommitTransactionAsync();

            // Assert
            _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// Tests that the CommitTransactionAsync method disposes the transaction when a transaction exists.
        /// </summary>
        [Fact]
        public async Task CommitTransactionAsync_ShouldDisposeTransaction_WhenTransactionExists()
        {
            // Arrange
            await _unitOfWork.BeginTransactionAsync();

            // Act
            await _unitOfWork.CommitTransactionAsync();

            // Assert
            _transactionMock.Verify(t => t.DisposeAsync(), Times.Once);
        }

        /// <summary>
        /// Tests that the RollbackTransactionAsync method rolls back the transaction when a transaction exists.
        /// </summary>
        [Fact]
        public async Task RollbackTransactionAsync_ShouldRollbackTransaction_WhenTransactionExists()
        {
            // Arrange
            await _unitOfWork.BeginTransactionAsync();

            // Act
            await _unitOfWork.RollbackTransactionAsync();

            // Assert
            _transactionMock.Verify(t => t.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// Tests that the RollbackTransactionAsync method disposes the transaction when a transaction exists.
        /// </summary>
        [Fact]
        public async Task RollbackTransactionAsync_ShouldDisposeTransaction_WhenTransactionExists()
        {
            // Arrange
            await _unitOfWork.BeginTransactionAsync();

            // Act
            await _unitOfWork.RollbackTransactionAsync();

            // Assert
            _transactionMock.Verify(t => t.DisposeAsync(), Times.Once);
        }

        /// <summary>
        /// Tests that the CommitTransactionAsync method does nothing when no transaction exists.
        /// </summary>
        [Fact]
        public async Task CommitTransactionAsync_ShouldDoNothing_WhenNoTransactionExists()
        {
            // Act
            await _unitOfWork.CommitTransactionAsync();

            // Assert
            _transactionMock.Verify(t => t.CommitAsync(It.IsAny<CancellationToken>()), Times.Never);
        }
    }

    /// <summary>
    /// Tests for the Dispose method.
    /// </summary>
    public class DisposeTests : UnitOfWorkTests
    {
        /// <summary>
        /// Tests that the Dispose method disposes the context.
        /// </summary>
        [Fact]
        public void Dispose_ShouldDisposeContext()
        {
            // Act
            _unitOfWork.Dispose();

            // Assert
            _contextMock.Verify(c => c.Dispose(), Times.Once);
        }
    }
}
