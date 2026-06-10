using Bio.Application.Features.Addresses.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Addresses.Queries;

public class AddressQueriesTests
{
    private readonly Mock<IAddressRepository> _repoMock = new();

    [Fact]
    public async Task GetMyAddresses_ShouldReturnList()
    {
        var userId = Guid.NewGuid();
        var addresses = new List<Address> { new(userId, "Billing", "John", "St", "City", "Dept", "000", null, "CO", null, false) };

        _repoMock.Setup(r => r.GetByUserIdAsync(userId, default)).ReturnsAsync(addresses);

        var handler = new GetMyAddressesQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetMyAddressesQuery(userId), default);

        result.Should().HaveCount(1);
    }
}
