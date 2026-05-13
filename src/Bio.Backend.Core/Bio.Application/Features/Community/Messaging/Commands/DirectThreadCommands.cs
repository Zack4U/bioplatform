using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentValidation;
using MediatR;

namespace Bio.Application.Features.Community.Messaging.Commands;

// =============================================================================
// INTERNAL MAPPER
// =============================================================================

internal static class MessagingMapper
{
    internal static DirectThreadSummaryDTO ToThreadSummary(DirectThread t, int unreadCount) => new(
        t.Id, t.Title, t.ThreadType,
        t.Participants.Count(p => p.LeftAt == null),
        unreadCount, t.CreatedAt, t.UpdatedAt);

    internal static DirectMessageResponseDTO ToMessageResponse(DirectMessage m, bool isRead) => new(
        m.Id, m.ThreadId, m.SenderUserId,
        m.SenderUser?.FullName ?? string.Empty,
        m.IsDeleted ? "[deleted]" : m.Content,
        m.IsDeleted, m.CreatedAt, isRead);
}

// =============================================================================
// CREATE DIRECT THREAD
// =============================================================================

public record CreateDirectThreadCommand(
    CreateDirectThreadDTO Dto,
    Guid ActorId) : IRequest<DirectThreadSummaryDTO>;

public class CreateDirectThreadCommandHandler
    : IRequestHandler<CreateDirectThreadCommand, DirectThreadSummaryDTO>
{
    private readonly IDirectThreadRepository _repo;
    private readonly IUserRepository _userRepo;
    private readonly IUnitOfWork _uow;

    public CreateDirectThreadCommandHandler(
        IDirectThreadRepository repo, IUserRepository userRepo, IUnitOfWork uow)
    { _repo = repo; _userRepo = userRepo; _uow = uow; }

    public async Task<DirectThreadSummaryDTO> Handle(
        CreateDirectThreadCommand request, CancellationToken ct)
    {
        var dto = request.Dto;

        // For Direct threads, exactly 1 other participant required
        if (dto.ThreadType == "Direct")
        {
            if (dto.ParticipantIds.Count != 1)
                throw new Bio.Domain.Exceptions.ValidationException("Direct threads require exactly 1 other participant.");

            var otherUserId = dto.ParticipantIds[0];
            if (otherUserId == request.ActorId)
                throw new Bio.Domain.Exceptions.ValidationException("Cannot create a direct thread with yourself.");

            // Check if thread already exists between the two users
            var existing = await _repo.GetDirectThreadBetweenUsersAsync(
                request.ActorId, otherUserId, ct);
            if (existing is not null)
                return MessagingMapper.ToThreadSummary(existing, 0);

            _ = await _userRepo.GetByIdAsync(otherUserId)
                ?? throw new NotFoundException(nameof(User), otherUserId);
        }

        var thread = new DirectThread(dto.ThreadType, dto.Title);
        await _repo.AddThreadAsync(thread, ct);

        // Add creator as participant
        await _repo.AddParticipantAsync(
            new DirectThreadParticipant(thread.Id, request.ActorId), ct);

        // Add other participants
        foreach (var participantId in dto.ParticipantIds)
        {
            if (participantId == request.ActorId) continue;
            await _repo.AddParticipantAsync(
                new DirectThreadParticipant(thread.Id, participantId), ct);
        }

        await _uow.SaveChangesAsync(ct);
        return MessagingMapper.ToThreadSummary(thread, 0);
    }
}

// =============================================================================
// SEND MESSAGE
// =============================================================================

public record SendDirectMessageCommand(
    Guid ThreadId,
    SendDirectMessageDTO Dto,
    Guid ActorId) : IRequest<DirectMessageResponseDTO>;

public class SendDirectMessageCommandHandler
    : IRequestHandler<SendDirectMessageCommand, DirectMessageResponseDTO>
{
    private readonly IDirectThreadRepository _repo;
    private readonly IUnitOfWork _uow;

    public SendDirectMessageCommandHandler(IDirectThreadRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<DirectMessageResponseDTO> Handle(
        SendDirectMessageCommand request, CancellationToken ct)
    {
        var isParticipant = await _repo.IsParticipantAsync(request.ThreadId, request.ActorId, ct);
        if (!isParticipant)
            throw new ForbiddenException("You are not a participant in this thread.");

        var thread = await _repo.GetByIdWithParticipantsAsync(request.ThreadId, ct)
            ?? throw new NotFoundException(nameof(DirectThread), request.ThreadId);

        var message = new DirectMessage(request.ThreadId, request.ActorId, request.Dto.Content);
        await _repo.AddMessageAsync(message, ct);
        thread.UpdateActivity();
        await _uow.SaveChangesAsync(ct);

        return MessagingMapper.ToMessageResponse(message, false);
    }
}

// =============================================================================
// MARK MESSAGES AS READ
// =============================================================================

public record MarkThreadMessagesReadCommand(
    Guid ThreadId,
    Guid ActorId) : IRequest<int>; // Returns count of newly marked messages

public class MarkThreadMessagesReadCommandHandler
    : IRequestHandler<MarkThreadMessagesReadCommand, int>
{
    private readonly IDirectThreadRepository _repo;
    private readonly IUnitOfWork _uow;

    public MarkThreadMessagesReadCommandHandler(IDirectThreadRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<int> Handle(MarkThreadMessagesReadCommand request, CancellationToken ct)
    {
        var isParticipant = await _repo.IsParticipantAsync(request.ThreadId, request.ActorId, ct);
        if (!isParticipant)
            throw new ForbiddenException("You are not a participant in this thread.");

        var unreadMessages = await _repo.GetUnreadMessagesAsync(
            request.ThreadId, request.ActorId, ct);

        foreach (var msg in unreadMessages)
        {
            var alreadyRead = await _repo.MessageReadExistsAsync(msg.Id, request.ActorId, ct);
            if (!alreadyRead)
                await _repo.AddMessageReadAsync(
                    new DirectMessageRead(msg.Id, request.ActorId), ct);
        }

        await _uow.SaveChangesAsync(ct);
        return unreadMessages.Count;
    }
}

// Validators
public class CreateDirectThreadCommandValidator : AbstractValidator<CreateDirectThreadCommand>
{
    private static readonly string[] ValidThreadTypes = ["Direct", "Group"];

    public CreateDirectThreadCommandValidator()
    {
        RuleFor(x => x.Dto.ThreadType)
            .Must(t => ValidThreadTypes.Contains(t))
            .WithMessage("ThreadType must be 'Direct' or 'Group'.");

        RuleFor(x => x.Dto.ParticipantIds)
            .NotEmpty().WithMessage("At least one participant is required.");
    }
}

public class SendDirectMessageCommandValidator : AbstractValidator<SendDirectMessageCommand>
{
    public SendDirectMessageCommandValidator()
    {
        RuleFor(x => x.Dto.Content)
            .NotEmpty().WithMessage("Message content is required.");
    }
}
