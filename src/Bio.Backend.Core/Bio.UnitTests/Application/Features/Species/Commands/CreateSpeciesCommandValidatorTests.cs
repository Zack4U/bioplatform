using Bio.Application.DTOs;
using Bio.Application.Features.Species.Commands.CreateSpecies;
using Xunit;

namespace Bio.UnitTests.Application.Features.Species.Commands;

public class CreateSpeciesCommandValidatorTests
{
    private readonly CreateSpeciesCommandValidator _validator = new();

    [Fact]
    public void Should_HaveError_When_ScientificNameIsEmpty()
    {
        var dto = new SpeciesCreateDTO { ScientificName = "", Slug = "valid-slug" };
        var command = new CreateSpeciesCommand(dto);
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Dto.ScientificName");
    }

    [Fact]
    public void Should_HaveError_When_SlugIsEmpty()
    {
        var dto = new SpeciesCreateDTO { ScientificName = "Quercus humboldtii", Slug = "" };
        var command = new CreateSpeciesCommand(dto);
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Dto.Slug");
    }

    [Fact]
    public void Should_HaveError_When_SlugExceedsMaxLength()
    {
        var dto = new SpeciesCreateDTO { ScientificName = "Quercus humboldtii", Slug = new string('a', 151) };
        var command = new CreateSpeciesCommand(dto);
        var result = _validator.Validate(command);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Dto.Slug");
    }

    [Fact]
    public void Should_NotHaveError_When_CommandIsValid()
    {
        var dto = new SpeciesCreateDTO
        {
            ScientificName = "Quercus humboldtii",
            Slug = "quercus-humboldtii",
            CommonName = "Roble"
        };
        var command = new CreateSpeciesCommand(dto);
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }
}
