using Bio.Domain.Entities;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

public class UserDomainTests
{
    [Fact]
    public void Verify_MarksUserAsVerified()
    {
        var user = new User(Guid.NewGuid(), "John", "test@test.com", "hash", "salt");
        Assert.False(user.IsVerified);

        user.Verify();

        Assert.True(user.IsVerified);
        Assert.NotNull(user.UpdatedAt);
    }

    [Fact]
    public void RecordLogin_UpdatesLastLogin()
    {
        var user = new User(Guid.NewGuid(), "John", "test@test.com", "hash", "salt");
        Assert.Null(user.LastLogin);

        user.RecordLogin();

        Assert.NotNull(user.LastLogin);
    }

    [Fact]
    public void Deactivate_SetsIsActiveToFalse()
    {
        var user = new User(Guid.NewGuid(), "John", "test@test.com", "hash", "salt");
        Assert.True(user.IsActive);

        user.Deactivate();

        Assert.False(user.IsActive);
        Assert.NotNull(user.UpdatedAt);
    }

    [Fact]
    public void ChangePassword_UpdatesHashAndSalt()
    {
        var user = new User(Guid.NewGuid(), "John", "test@test.com", "oldHash", "oldSalt");

        user.ChangePassword("newHash", "newSalt");

        Assert.Equal("newHash", user.PasswordHash);
        Assert.Equal("newSalt", user.Salt);
        Assert.NotNull(user.UpdatedAt);
    }

    [Fact]
    public void ChangePassword_WithEmptyHash_Throws()
    {
        var user = new User(Guid.NewGuid(), "John", "test@test.com", "oldHash", "oldSalt");

        Assert.Throws<ArgumentException>(() => user.ChangePassword("", "newSalt"));
        Assert.Throws<ArgumentException>(() => user.ChangePassword("newHash", ""));
    }
}
