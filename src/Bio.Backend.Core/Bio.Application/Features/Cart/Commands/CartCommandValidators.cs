using Bio.Application.Features.Cart.Commands;
using FluentValidation;

namespace Bio.Application.Features.Cart.Commands;

public class AddCartItemCommandValidator : AbstractValidator<AddCartItemCommand>
{
    public AddCartItemCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Dto.ProductId).NotEmpty();
        RuleFor(x => x.Dto.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be at least 1.")
            .LessThanOrEqualTo(999).WithMessage("Quantity cannot exceed 999.");
    }
}

public class UpdateCartItemCommandValidator : AbstractValidator<UpdateCartItemCommand>
{
    public UpdateCartItemCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.ItemId).NotEmpty();
        RuleFor(x => x.Dto.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be at least 1.")
            .LessThanOrEqualTo(999).WithMessage("Quantity cannot exceed 999.");
    }
}

public class CreateTraceabilityBatchCommandValidator
    : AbstractValidator<Bio.Application.Features.Traceability.Commands.CreateTraceabilityBatchCommand>
{
    public CreateTraceabilityBatchCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.ActorId).NotEmpty();
        RuleFor(x => x.Dto.BatchCode).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Dto.OriginLocation).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Dto.HarvestDate)
            .NotEmpty()
            .LessThanOrEqualTo(DateTime.UtcNow.AddDays(1))
            .WithMessage("Harvest date cannot be in the future.");
        RuleFor(x => x.Dto.ProcessingDetails).MaximumLength(2000).When(x => x.Dto.ProcessingDetails != null);
        RuleFor(x => x.Dto.BlockchainHash).MaximumLength(256).When(x => x.Dto.BlockchainHash != null);
    }
}
