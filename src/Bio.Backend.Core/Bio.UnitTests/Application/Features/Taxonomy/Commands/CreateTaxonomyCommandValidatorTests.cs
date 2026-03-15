using Bio.Application.DTOs;
using Bio.Application.Features.Taxonomy.Commands.CreateTaxonomy;
using Xunit;

namespace Bio.UnitTests.Application.Features.Taxonomy.Commands;

public class CreateTaxonomyCommandValidatorTests
{
    private readonly CreateTaxonomyCommandValidator _validator = new();

    [Fact]
    public void Should_NotHaveError_When_CommandIsValid()
    {
        var dto = new TaxonomyCreateDTO { Kingdom = "Animalia", Genus = "Panthera" };
        var command = new CreateTaxonomyCommand(dto);
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Should_HaveError_When_KingdomExceedsMaxLength()
    {
        var dto = new TaxonomyCreateDTO { Kingdom = new string('A', 51) };
        var command = new CreateTaxonomyCommand(dto);
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Dto.Kingdom");
    }

    [Fact]
    public void Should_HaveError_When_GenusExceedsMaxLength()
    {
        var dto = new TaxonomyCreateDTO { Genus = new string('A', 51) };
        var command = new CreateTaxonomyCommand(dto);
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Dto.Genus");
    }
}
