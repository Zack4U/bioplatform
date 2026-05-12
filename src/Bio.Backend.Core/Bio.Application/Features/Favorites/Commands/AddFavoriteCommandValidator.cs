using Bio.Application.Features.Favorites.Commands;
using FluentValidation;

namespace Bio.Application.Features.Favorites.Commands;

public class AddFavoriteCommandValidator : AbstractValidator<AddFavoriteCommand>
{
    private static readonly HashSet<string> AllowedTargetTypes = ["Product", "Species"];

    public AddFavoriteCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Dto.TargetId).NotEmpty();
        RuleFor(x => x.Dto.TargetType)
            .NotEmpty()
            .Must(t => AllowedTargetTypes.Contains(t))
            .WithMessage($"TargetType must be one of: {string.Join(", ", AllowedTargetTypes)}.");
    }
}
