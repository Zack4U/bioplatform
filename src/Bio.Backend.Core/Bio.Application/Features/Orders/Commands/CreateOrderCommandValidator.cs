using Bio.Application.DTOs;
using Bio.Application.Features.Orders.Commands;
using FluentValidation;

namespace Bio.Application.Features.Orders.Commands;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.BuyerId).NotEmpty();

        RuleFor(x => x.Dto.Items)
            .NotEmpty().WithMessage("Order must contain at least one item.")
            .Must(items => items.Count <= 50).WithMessage("An order cannot have more than 50 line items.");

        RuleForEach(x => x.Dto.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).NotEmpty().WithMessage("Product ID is required.");
            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Quantity must be at least 1.")
                .LessThanOrEqualTo(999).WithMessage("Quantity per item cannot exceed 999.");
        });

        RuleFor(x => x.Dto.PaymentMethod)
            .NotEmpty().WithMessage("Payment method is required.")
            .MaximumLength(50);
    }
}
