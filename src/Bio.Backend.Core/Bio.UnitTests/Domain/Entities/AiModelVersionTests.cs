using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="AiModelVersion"/> domain entity.
/// </summary>
public class AiModelVersionTests
{
    private const string ModelName = "ResNet50";
    private const string Version = "v1.0.0";
    private const decimal AccuracyMetric = 0.8750m;
    private static readonly DateTime DeployedAt = new(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc);

    public class Constructor : AiModelVersionTests
    {
        [Fact]
        public void ShouldInitializeWithCorrectProperties()
        {
            var model = new AiModelVersion(ModelName, Version, AccuracyMetric, DeployedAt, true, "Initial release");

            model.ModelName.Should().Be(ModelName);
            model.Version.Should().Be(Version);
            model.AccuracyMetric.Should().Be(AccuracyMetric);
            model.DeployedAt.Should().Be(DeployedAt);
            model.IsActive.Should().BeTrue();
            model.Notes.Should().Be("Initial release");
        }
    }

    public class Behavior : AiModelVersionTests
    {
        [Fact]
        public void ActivateAndDeactivate_ShouldToggleIsActive()
        {
            var model = new AiModelVersion(ModelName, Version, AccuracyMetric, DeployedAt);
            model.IsActive.Should().BeFalse();

            model.Activate();
            model.IsActive.Should().BeTrue();

            model.Deactivate();
            model.IsActive.Should().BeFalse();
        }

        [Fact]
        public void SoftDelete_ShouldSetIsDeletedAndDeactivate()
        {
            var model = new AiModelVersion(ModelName, Version, AccuracyMetric, DeployedAt, true);
            model.IsActive.Should().BeTrue();
            model.IsDeleted.Should().BeFalse();

            model.SoftDelete();
            model.IsDeleted.Should().BeTrue();
            model.IsActive.Should().BeFalse();
        }

        [Fact]
        public void SetValidationAccuracy_ShouldSetValidationAccuracy()
        {
            var model = new AiModelVersion(ModelName, Version, AccuracyMetric, DeployedAt);
            model.ValidationAccuracy.Should().BeNull();

            model.SetValidationAccuracy(0.92m);
            model.ValidationAccuracy.Should().Be(0.92m);
        }
    }
}
