using Bio.Application.DTOs;
using FluentValidation;

namespace Bio.Application.Features.Community.Posts.Commands;

public class CreateCommunityPostCommandValidator : AbstractValidator<CreateCommunityPostCommand>
{
    public CreateCommunityPostCommandValidator()
    {
        RuleFor(x => x.Dto.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Dto.Content)
            .NotEmpty().WithMessage("Content is required.");

        RuleFor(x => x.Dto.Category)
            .MaximumLength(50).WithMessage("Category must not exceed 50 characters.")
            .When(x => x.Dto.Category != null);
    }
}

public class UpdateCommunityPostCommandValidator : AbstractValidator<UpdateCommunityPostCommand>
{
    private static readonly string[] ValidStatuses = ["Draft", "Published", "Archived", "Hidden"];

    public UpdateCommunityPostCommandValidator()
    {
        RuleFor(x => x.Dto.Title)
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.")
            .When(x => x.Dto.Title != null);

        RuleFor(x => x.Dto.Status)
            .Must(s => s == null || ValidStatuses.Contains(s))
            .WithMessage($"Status must be one of: {string.Join(", ", ValidStatuses)}");
    }
}
