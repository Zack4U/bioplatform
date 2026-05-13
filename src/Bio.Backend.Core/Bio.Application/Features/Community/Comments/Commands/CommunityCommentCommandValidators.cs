using FluentValidation;

namespace Bio.Application.Features.Community.Comments.Commands;

public class CreateCommunityCommentCommandValidator : AbstractValidator<CreateCommunityCommentCommand>
{
    public CreateCommunityCommentCommandValidator()
    {
        RuleFor(x => x.Dto.Content)
            .NotEmpty().WithMessage("Comment content is required.");
    }
}

public class UpdateCommunityCommentCommandValidator : AbstractValidator<UpdateCommunityCommentCommand>
{
    public UpdateCommunityCommentCommandValidator()
    {
        RuleFor(x => x.Dto.Content)
            .NotEmpty().WithMessage("Comment content is required.");
    }
}
