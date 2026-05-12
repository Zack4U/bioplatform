using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repository for direct messaging threads and messages.
/// Bounded context: Networking / Messaging (SQL Server).
/// </summary>
public interface IDirectThreadRepository
{
    Task<DirectThread?> GetByIdWithParticipantsAsync(Guid threadId, CancellationToken ct = default);
    Task<DirectThread?> GetDirectThreadBetweenUsersAsync(
        Guid userAId, Guid userBId, CancellationToken ct = default);
    Task<(IReadOnlyList<DirectThread> Items, int TotalCount)> GetMyThreadsAsync(
        Guid userId, int page, int pageSize, CancellationToken ct = default);
    Task<(IReadOnlyList<DirectMessage> Items, int TotalCount)> GetMessagesByThreadAsync(
        Guid threadId, int page, int pageSize, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);
    Task<bool> IsParticipantAsync(Guid threadId, Guid userId, CancellationToken ct = default);
    Task AddThreadAsync(DirectThread thread, CancellationToken ct = default);
    Task AddMessageAsync(DirectMessage message, CancellationToken ct = default);
    Task AddParticipantAsync(DirectThreadParticipant participant, CancellationToken ct = default);
    Task AddMessageReadAsync(DirectMessageRead read, CancellationToken ct = default);
    Task<List<DirectMessage>> GetUnreadMessagesAsync(
        Guid threadId, Guid userId, CancellationToken ct = default);
    Task<bool> MessageReadExistsAsync(Guid messageId, Guid userId, CancellationToken ct = default);
}
