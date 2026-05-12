using Bio.Application.Behaviors;
using FluentAssertions;
using MediatR;
using Xunit;

namespace Bio.UnitTests.Application.Behaviors;

public class DummyCommand : IRequest<string>
{
    public string Name { get; set; } = string.Empty;
    public DummyNested Dto { get; set; } = new();
}

public class DummyNested
{
    public string Description { get; set; } = string.Empty;
}

public class HtmlSanitizationBehaviorTests
{
    [Fact]
    public async Task Handle_ShouldSanitizeStringProperties()
    {
        var behavior = new HtmlSanitizationBehavior<DummyCommand, string>();
        var command = new DummyCommand
        {
            Name = "<script>alert('xss');</script>Test",
            Dto = new DummyNested { Description = "<b>Bold</b><iframe src='bad'></iframe>" }
        };

        var next = new RequestHandlerDelegate<string>(() => Task.FromResult("OK"));

        await behavior.Handle(command, next, default);

        command.Name.Should().Be("Test");
        command.Dto.Description.Should().Be("<b>Bold</b>");
    }
}
