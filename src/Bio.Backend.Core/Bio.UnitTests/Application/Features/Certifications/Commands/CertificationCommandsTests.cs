using Bio.Application.DTOs;
using Bio.Application.Features.Certifications.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Certifications.Commands;

public class CertificationCommandsTests
{
    private readonly Mock<ICertificationRepository> _certRepoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    private Product CreateProduct(Guid id, Guid entrepreneurId)
    {
        return new Product(entrepreneurId, Guid.NewGuid(), "P", "p", "D", 10, 10, 10, null, null, null, null);
    }

    [Fact]
    public async Task CreateCertification_WhenValid_ShouldCreate()
    {
        var productId = Guid.NewGuid();
        var entrepreneurId = Guid.NewGuid();
        var product = CreateProduct(productId, entrepreneurId);
        var dto = new CertificationCreateDTO { Name = "Orgánico", CertificationType = "Type", IssuingBody = "Body", IssuedAt = DateTime.UtcNow };

        _productRepoMock.Setup(r => r.GetByIdAsync(productId, default)).ReturnsAsync(product);

        var handler = new CreateCertificationCommandHandler(_certRepoMock.Object, _productRepoMock.Object, _uowMock.Object);
        var cmd = new CreateCertificationCommand(productId, dto, entrepreneurId, "ENTREPRENEUR");

        var result = await handler.Handle(cmd, default);

        result.Should().NotBeNull();
        result.Name.Should().Be("Orgánico");
        _certRepoMock.Verify(r => r.AddAsync(It.IsAny<Certification>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task CreateCertification_WhenNotOwner_ShouldThrowForbidden()
    {
        var productId = Guid.NewGuid();
        var product = CreateProduct(productId, Guid.NewGuid()); // different owner
        var dto = new CertificationCreateDTO();

        _productRepoMock.Setup(r => r.GetByIdAsync(productId, default)).ReturnsAsync(product);

        var handler = new CreateCertificationCommandHandler(_certRepoMock.Object, _productRepoMock.Object, _uowMock.Object);
        var cmd = new CreateCertificationCommand(productId, dto, Guid.NewGuid(), "ENTREPRENEUR");

        await FluentActions.Awaiting(() => handler.Handle(cmd, default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdateCertification_WhenValid_ShouldUpdate()
    {
        var certId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var entrepreneurId = Guid.NewGuid();
        var product = CreateProduct(productId, entrepreneurId);
        var cert = new Certification(productId, "Old", "OldType", "OldBody", DateTime.UtcNow, null, null, null, null, null);
        var dto = new CertificationUpdateDTO { Name = "New" };

        _certRepoMock.Setup(r => r.GetByIdAsync(certId, default)).ReturnsAsync(cert);
        _productRepoMock.Setup(r => r.GetByIdAsync(productId, default)).ReturnsAsync(product);

        var handler = new UpdateCertificationCommandHandler(_certRepoMock.Object, _productRepoMock.Object, _uowMock.Object);
        var cmd = new UpdateCertificationCommand(certId, dto, entrepreneurId, "ENTREPRENEUR");

        var result = await handler.Handle(cmd, default);

        result.Should().NotBeNull();
        result.Name.Should().Be("New");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeleteCertification_WhenValid_ShouldDelete()
    {
        var certId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var entrepreneurId = Guid.NewGuid();
        var product = CreateProduct(productId, entrepreneurId);
        var cert = new Certification(productId, "Old", "OldType", "OldBody", DateTime.UtcNow, null, null, null, null, null);

        _certRepoMock.Setup(r => r.GetByIdAsync(certId, default)).ReturnsAsync(cert);
        _productRepoMock.Setup(r => r.GetByIdAsync(productId, default)).ReturnsAsync(product);

        var handler = new DeleteCertificationCommandHandler(_certRepoMock.Object, _productRepoMock.Object, _uowMock.Object);
        var cmd = new DeleteCertificationCommand(certId, entrepreneurId, "ENTREPRENEUR");

        await handler.Handle(cmd, default);

        _certRepoMock.Verify(r => r.DeleteAsync(cert, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
