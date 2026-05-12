using Bio.Application.DTOs;
using Bio.Application.Features.Addresses.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Addresses.Commands;

public class AddressCommandsTests
{
    private readonly Mock<IAddressRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    [Fact]
    public async Task CreateAddress_WhenValid_ShouldCreate()
    {
        var userId = Guid.NewGuid();
        var dto = new AddressCreateDTO { AddressType = "Billing", RecipientName = "John", StreetLine1 = "St 1", City = "City", Department = "Dept", PostalCode = "00000", Country = "CO", IsDefault = true };

        var handler = new CreateAddressCommandHandler(_repoMock.Object, _uowMock.Object);
        var result = await handler.Handle(new CreateAddressCommand(dto, userId), default);

        result.Should().NotBeNull();
        result.RecipientName.Should().Be("John");
        _repoMock.Verify(r => r.ClearDefaultsForUserAsync(userId, "Billing", default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdateAddress_WhenValid_ShouldUpdate()
    {
        var addressId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var address = new Address(userId, "Billing", "John", "St 1", "City", "Dept", "000", null, "CO", null, false);
        var dto = new AddressUpdateDTO { RecipientName = "Jane", IsDefault = true };

        _repoMock.Setup(r => r.GetByIdAsync(addressId, default)).ReturnsAsync(address);

        var handler = new UpdateAddressCommandHandler(_repoMock.Object, _uowMock.Object);
        var result = await handler.Handle(new UpdateAddressCommand(addressId, dto, userId), default);

        result.RecipientName.Should().Be("Jane");
        _repoMock.Verify(r => r.ClearDefaultsForUserAsync(userId, "Billing", default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task UpdateAddress_WhenNotOwner_ShouldThrowForbidden()
    {
        var addressId = Guid.NewGuid();
        var address = new Address(Guid.NewGuid(), "Billing", "John", "St 1", "City", "Dept", "000", null, "CO", null, false);

        _repoMock.Setup(r => r.GetByIdAsync(addressId, default)).ReturnsAsync(address);

        var handler = new UpdateAddressCommandHandler(_repoMock.Object, _uowMock.Object);
        await FluentActions.Awaiting(() => handler.Handle(new UpdateAddressCommand(addressId, new AddressUpdateDTO(), Guid.NewGuid()), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task DeleteAddress_WhenValid_ShouldDelete()
    {
        var addressId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var address = new Address(userId, "Billing", "John", "St 1", "City", "Dept", "000", null, "CO", null, false);

        _repoMock.Setup(r => r.GetByIdAsync(addressId, default)).ReturnsAsync(address);

        var handler = new DeleteAddressCommandHandler(_repoMock.Object, _uowMock.Object);
        await handler.Handle(new DeleteAddressCommand(addressId, userId), default);

        _repoMock.Verify(r => r.DeleteAsync(address, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
