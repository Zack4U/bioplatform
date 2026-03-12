using Bio.Domain.Constants;
using FluentAssertions;
using System.Reflection;
using Xunit;

namespace Bio.UnitTests.Domain.Constants;

/// <summary>
/// Unit tests for the <see cref="RoleNames"/> constants class.
/// Ensures that role definitions follow system-wide policies such as uppercase normalization and uniqueness.
/// </summary>
public class RoleNamesTests
{
    /// <summary>
    /// Helper method to retrieve all constant values from the RoleNames class using Reflection.
    /// </summary>
    /// <returns>A collection of role name strings.</returns>
    private static IEnumerable<string?> GetRoleValues() =>
        typeof(RoleNames)
            .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
            .Where(f => f.IsLiteral && !f.IsInitOnly)
            .Select(f => f.GetValue(null)?.ToString());

    /// <summary>
    /// Tests related to the format and naming conventions of the roles.
    /// </summary>
    public class Conventions : RoleNamesTests
    {
        /// <summary>
        /// Provides the names of all roles defined in <see cref="RoleNames"/> as test data.
        /// </summary>
        public static IEnumerable<object[]> GetRoleNamesData() =>
            GetRoleValues().Select(role => new object[] { role! });

        /// <summary>
        /// Ensures each defined role is in uppercase to match the normalization logic in the Domain entities and database.
        /// Using a Theory allows each role to be verified as an independent test case.
        /// </summary>
        /// <param name="roleName">The name of the role to verify.</param>
        [Theory]
        [MemberData(nameof(GetRoleNamesData))]
        public void Role_ShouldBeInUppercase(string roleName)
        {
            // Assert
            roleName.Should().Be(roleName.ToUpperInvariant(), 
                $"The role '{roleName}' must be in uppercase to maintain consistency with entity mapping.");
        }
    }

    /// <summary>
    /// Tests related to the integrity and uniqueness of the role definitions.
    /// </summary>
    public class Integrity : RoleNamesTests
    {
        /// <summary>
        /// Ensures that no two constants share the same value, preventing ambiguity in authorization logic.
        /// </summary>
        [Fact]
        public void RoleValues_ShouldBeUnique()
        {
            // Arrange & Act
            var roles = GetRoleValues();

            // Assert
            roles.Should().OnlyHaveUniqueItems("Each constant in RoleNames must represent a distinct system role.");
        }

        /// <summary>
        /// Verifies that essential system roles are properly defined and not empty.
        /// </summary>
        /// <param name="roleName">The role constant to check.</param>
        [Theory]
        [InlineData(RoleNames.Admin)]
        [InlineData(RoleNames.Buyer)]
        [InlineData(RoleNames.Researcher)]
        public void EssentialRoles_ShouldBeDefined(string roleName)
        {
            // Assert
            roleName.Should().NotBeNullOrWhiteSpace("Essential system roles must have a valid value.");
        }
    }
}
