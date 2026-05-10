using Bio.Application.DTOs;
using Bio.Application.Features.Products.Commands;
using Bio.Application.Features.Products.Queries;
using Bio.Application.Features.ProductCategories.Commands;
using Bio.Application.Features.ProductCategories.Queries;
using Bio.Application.Features.ProductReviews.Commands;
using Bio.Application.Features.ProductReviews.Queries;
using Bio.Application.Features.ProductImages.Commands;
using Bio.Application.Features.ProductImages.Queries;
using Bio.Application.Features.Favorites.Commands;
using Bio.Application.Features.Favorites.Queries;
using Bio.Application.Features.Addresses.Commands;
using Bio.Application.Features.Addresses.Queries;
using Bio.Application.Features.Orders.Commands;
using Bio.Application.Features.Orders.Queries;
using Bio.Application.Features.Certifications.Commands;
using Bio.Application.Features.Certifications.Queries;
using Bio.Application.Features.AbsPermits.Commands;
using Bio.Application.Features.AbsPermits.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features;

/// <summary>Tests for Product CQRS Handlers.</summary>
public class ProductHandlerTests
{
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IAbsPermitRepository> _absRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly Mock<ICacheService> _cache = new();
    private static readonly Guid EntrepreneurId = Guid.NewGuid();
    private static readonly Guid SpeciesId = Guid.NewGuid();

    [Fact]
    public async Task CreateProduct_ShouldThrow_WhenNoAbsPermit()
    {
        _absRepo.Setup(x => x.GetActiveByEntrepreneurAndSpeciesAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), default))
            .ReturnsAsync((AbsPermit?)null);

        var handler = new CreateProductCommandHandler(_productRepo.Object, _absRepo.Object, _uow.Object);
        var dto = new ProductCreateDTO { Name = "Test", Slug = "test", Description = "Desc", BasePrice = 10, SellPrice = 15, StockQuantity = 10, BaseSpeciesId = SpeciesId };

        var act = () => handler.Handle(new CreateProductCommand(dto, EntrepreneurId), default);
        await act.Should().ThrowAsync<ForbiddenException>().WithMessage("*ABS permit*");
    }

    [Fact]
    public async Task CreateProduct_ShouldSucceed_WhenAbsPermitActive()
    {
        var permit = new AbsPermit(EntrepreneurId, SpeciesId, "RES-001", DateTime.UtcNow.AddDays(-30), DateTime.UtcNow.AddYears(1), "MinAmbiente");
        _absRepo.Setup(x => x.GetActiveByEntrepreneurAndSpeciesAsync(EntrepreneurId, SpeciesId, default)).ReturnsAsync(permit);

        var savedProduct = (Product?)null;
        _productRepo.Setup(x => x.AddAsync(It.IsAny<Product>(), default))
            .Callback<Product, CancellationToken>((p, _) => savedProduct = p);
        _productRepo.Setup(x => x.GetByIdWithDetailsAsync(It.IsAny<Guid>(), default))
            .ReturnsAsync(() =>
            {
                // Return a product with empty collections for mapping
                return new Product(EntrepreneurId, SpeciesId, "Test", "test", "Desc", 10, 15, 10);
            });

        var handler = new CreateProductCommandHandler(_productRepo.Object, _absRepo.Object, _uow.Object);
        var dto = new ProductCreateDTO { Name = "Test", Slug = "test", Description = "Desc", BasePrice = 10, SellPrice = 15, StockQuantity = 10, BaseSpeciesId = SpeciesId };

        var result = await handler.Handle(new CreateProductCommand(dto, EntrepreneurId), default);

        result.Should().NotBeNull();
        result.Name.Should().Be("Test");
        result.IsActive.Should().BeFalse("Products start inactive");
        _uow.Verify(x => x.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdateProduct_ShouldThrow_WhenNotOwner()
    {
        var product = new Product(Guid.NewGuid(), SpeciesId, "Test", "test", "Desc", 10, 15, 10);
        _productRepo.Setup(x => x.GetByIdWithDetailsAsync(product.Id, default)).ReturnsAsync(product);

        var handler = new UpdateProductCommandHandler(_productRepo.Object, _uow.Object, _cache.Object);
        var act = () => handler.Handle(new UpdateProductCommand(product.Id, new ProductUpdateDTO(), EntrepreneurId, "ENTREPRENEUR"), default);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task ActivateProduct_ShouldSetIsActive()
    {
        var product = new Product(EntrepreneurId, SpeciesId, "Test", "test", "Desc", 10, 15, 10);
        product.IsActive.Should().BeFalse();
        _productRepo.Setup(x => x.GetByIdAsync(product.Id, default)).ReturnsAsync(product);

        var handler = new ActivateProductCommandHandler(_productRepo.Object, _uow.Object, _cache.Object);
        await handler.Handle(new ActivateProductCommand(product.Id), default);

        product.IsActive.Should().BeTrue();
    }
}

/// <summary>Tests for ProductCategory CQRS Handlers.</summary>
public class ProductCategoryHandlerTests
{
    private readonly Mock<IProductCategoryRepository> _repo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    [Fact]
    public async Task CreateCategory_ShouldThrow_WhenDuplicate()
    {
        _repo.Setup(x => x.ExistsByNameAsync("Organic", default)).ReturnsAsync(true);

        var handler = new CreateProductCategoryCommandHandler(_repo.Object, _uow.Object);
        var act = () => handler.Handle(new CreateProductCategoryCommand(new ProductCategoryCreateDTO("Organic")), default);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateCategory_ShouldSucceed_WhenUnique()
    {
        _repo.Setup(x => x.ExistsByNameAsync("Organic", default)).ReturnsAsync(false);

        var handler = new CreateProductCategoryCommandHandler(_repo.Object, _uow.Object);
        var result = await handler.Handle(new CreateProductCategoryCommand(new ProductCategoryCreateDTO("Organic")), default);

        result.Name.Should().Be("Organic");
        _uow.Verify(x => x.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeleteCategory_ShouldThrow_WhenNotFound()
    {
        _repo.Setup(x => x.GetByIdAsync(999, default)).ReturnsAsync((ProductCategory?)null);

        var handler = new DeleteProductCategoryCommandHandler(_repo.Object, _uow.Object);
        var act = () => handler.Handle(new DeleteProductCategoryCommand(999), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}

/// <summary>Tests for ProductReview CQRS Handlers.</summary>
public class ProductReviewHandlerTests
{
    private readonly Mock<IProductReviewRepository> _reviewRepo = new();
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly Guid ProductId = Guid.NewGuid();

    [Fact]
    public async Task CreateReview_ShouldThrow_WhenAlreadyReviewed()
    {
        _productRepo.Setup(x => x.GetByIdAsync(ProductId, default)).ReturnsAsync(new Product(Guid.NewGuid(), Guid.NewGuid(), "P", "p", "D", 10, 15, 1));
        _reviewRepo.Setup(x => x.ExistsByUserAndProductAsync(UserId, ProductId, default)).ReturnsAsync(true);

        var _orderRepo = new Mock<IOrderRepository>();
        _orderRepo.Setup(x => x.HasPurchasedProductAsync(UserId, ProductId, default)).ReturnsAsync(true);

        var handler = new CreateProductReviewCommandHandler(_reviewRepo.Object, _productRepo.Object, _orderRepo.Object, _uow.Object);
        var act = () => handler.Handle(new CreateProductReviewCommand(ProductId, new ProductReviewCreateDTO(5, "Great", "Loved it"), UserId), default);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateReview_ShouldThrow_WhenNotOwner()
    {
        var review = new ProductReview(ProductId, Guid.NewGuid(), 4, "OK", "Fine");
        _reviewRepo.Setup(x => x.GetByIdAsync(review.Id, default)).ReturnsAsync(review);

        var handler = new UpdateProductReviewCommandHandler(_reviewRepo.Object, _uow.Object);
        var act = () => handler.Handle(new UpdateProductReviewCommand(review.Id, new ProductReviewUpdateDTO(null, null, null), UserId), default);

        await act.Should().ThrowAsync<ForbiddenException>();
    }
}

/// <summary>Tests for Favorite CQRS Handlers.</summary>
public class FavoriteHandlerTests
{
    private readonly Mock<IFavoriteRepository> _repo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public async Task AddFavorite_ShouldThrow_WhenDuplicate()
    {
        _repo.Setup(x => x.ExistsAsync(UserId, "Product", It.IsAny<Guid>(), default)).ReturnsAsync(true);

        var handler = new AddFavoriteCommandHandler(_repo.Object, _uow.Object);
        var act = () => handler.Handle(new AddFavoriteCommand(new FavoriteCreateDTO("Product", Guid.NewGuid()), UserId), default);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task RemoveFavorite_ShouldThrow_WhenNotOwner()
    {
        var fav = new Favorite(Guid.NewGuid(), "Product", Guid.NewGuid());
        _repo.Setup(x => x.GetByIdAsync(fav.Id, default)).ReturnsAsync(fav);

        var handler = new RemoveFavoriteCommandHandler(_repo.Object, _uow.Object);
        var act = () => handler.Handle(new RemoveFavoriteCommand(fav.Id, UserId), default);

        await act.Should().ThrowAsync<ForbiddenException>();
    }
}

/// <summary>Tests for Address CQRS Handlers.</summary>
public class AddressHandlerTests
{
    private readonly Mock<IAddressRepository> _repo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public async Task CreateAddress_ShouldClearDefaults_WhenIsDefault()
    {
        var handler = new CreateAddressCommandHandler(_repo.Object, _uow.Object);
        var dto = new AddressCreateDTO
        {
            AddressType = "Shipping", RecipientName = "John", StreetLine1 = "St 1",
            City = "Manizales", Department = "Caldas", PostalCode = "170001", IsDefault = true
        };

        var result = await handler.Handle(new CreateAddressCommand(dto, UserId), default);

        _repo.Verify(x => x.ClearDefaultsForUserAsync(UserId, "Shipping", default), Times.Once);
        result.RecipientName.Should().Be("John");
        result.IsDefault.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateAddress_ShouldThrow_WhenNotOwner()
    {
        var addr = new Address(Guid.NewGuid(), "Shipping", "Jane", "St 2", "City", "Dept", "12345");
        _repo.Setup(x => x.GetByIdAsync(addr.Id, default)).ReturnsAsync(addr);

        var handler = new UpdateAddressCommandHandler(_repo.Object, _uow.Object);
        var act = () => handler.Handle(new UpdateAddressCommand(addr.Id, new AddressUpdateDTO(), UserId), default);

        await act.Should().ThrowAsync<ForbiddenException>();
    }
}

/// <summary>Tests for AbsPermit CQRS Handlers.</summary>
public class AbsPermitHandlerTests
{
    private readonly Mock<IAbsPermitRepository> _repo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    [Fact]
    public async Task CreateAbsPermit_ShouldSucceed()
    {
        var handler = new CreateAbsPermitCommandHandler(_repo.Object, _uow.Object);
        var dto = new AbsPermitCreateDTO
        {
            EntrepreneurId = Guid.NewGuid(), SpeciesId = Guid.NewGuid(),
            ResolutionNumber = "RES-123", EmissionDate = DateTime.UtcNow,
            ExpirationDate = DateTime.UtcNow.AddYears(1), GrantingAuthority = "MinAmbiente"
        };

        var result = await handler.Handle(new CreateAbsPermitCommand(dto), default);

        result.ResolutionNumber.Should().Be("RES-123");
        result.Status.Should().Be("Active");
        _uow.Verify(x => x.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdateAbsPermit_ShouldThrow_WhenNotFound()
    {
        _repo.Setup(x => x.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync((AbsPermit?)null);

        var handler = new UpdateAbsPermitCommandHandler(_repo.Object, _uow.Object);
        var act = () => handler.Handle(new UpdateAbsPermitCommand(Guid.NewGuid(), new AbsPermitUpdateDTO()), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
