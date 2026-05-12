using Bio.Application.DTOs;
using Bio.Application.Features.Traceability.Commands;
using FluentValidation.TestHelper;
using Xunit;

namespace Bio.UnitTests.Application.Features.Traceability.Commands;

public class TraceabilityCommandValidatorsTests
{
    private readonly Bio.Application.Features.Cart.Commands.CreateTraceabilityBatchCommandValidator _validator = new();

    [Fact]
    public void CreateTraceabilityBatch_ShouldHaveError_WhenBatchCodeIsEmpty()
    {
        var cmd = new CreateTraceabilityBatchCommand(Guid.NewGuid(), new TraceabilityBatchCreateDTO { BatchCode = "", HarvestDate = DateTime.UtcNow, OriginLocation = "L", ProcessingDetails = "D", BlockchainHash = "H" }, Guid.NewGuid(), "ADMIN");
        var result = _validator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Dto.BatchCode);
    }

    [Fact]
    public void CreateTraceabilityBatch_ShouldHaveError_WhenHarvestDateIsInFuture()
    {
        var cmd = new CreateTraceabilityBatchCommand(Guid.NewGuid(), new TraceabilityBatchCreateDTO { BatchCode = "B001", HarvestDate = DateTime.UtcNow.AddDays(2), OriginLocation = "L", ProcessingDetails = "D", BlockchainHash = "H" }, Guid.NewGuid(), "ADMIN");
        var result = _validator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Dto.HarvestDate);
    }
}
