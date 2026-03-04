using System.Reflection;

namespace Bio.Tests.Architecture;

/// <summary>
/// Validates Clean Architecture dependency rules:
/// Domain → Application → Infrastructure → API
/// Domain must NOT reference any other project layer.
/// </summary>
public class ArchitectureTests
{
    private static readonly Assembly DomainAssembly = typeof(Bio.Domain.Class1).Assembly;
    private static readonly Assembly ApplicationAssembly = typeof(Bio.Application.Class1).Assembly;

    [Fact]
    public void Domain_ShouldNotReference_ApplicationLayer()
    {
        var referencedAssemblies = DomainAssembly
            .GetReferencedAssemblies()
            .Select(a => a.Name)
            .ToList();

        Assert.DoesNotContain("Bio.Application", referencedAssemblies);
    }

    [Fact]
    public void Domain_ShouldNotReference_InfrastructureLayer()
    {
        var referencedAssemblies = DomainAssembly
            .GetReferencedAssemblies()
            .Select(a => a.Name)
            .ToList();

        Assert.DoesNotContain("Bio.Infrastructure", referencedAssemblies);
    }

    [Fact]
    public void Domain_ShouldNotReference_ApiLayer()
    {
        var referencedAssemblies = DomainAssembly
            .GetReferencedAssemblies()
            .Select(a => a.Name)
            .ToList();

        Assert.DoesNotContain("Bio.API", referencedAssemblies);
    }

    [Fact]
    public void Application_ShouldNotReference_InfrastructureLayer()
    {
        var referencedAssemblies = ApplicationAssembly
            .GetReferencedAssemblies()
            .Select(a => a.Name)
            .ToList();

        Assert.DoesNotContain("Bio.Infrastructure", referencedAssemblies);
    }

    [Fact]
    public void Application_ShouldNotReference_ApiLayer()
    {
        var referencedAssemblies = ApplicationAssembly
            .GetReferencedAssemblies()
            .Select(a => a.Name)
            .ToList();

        Assert.DoesNotContain("Bio.API", referencedAssemblies);
    }
}
