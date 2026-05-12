using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

/// <summary>
/// Repository for user networking connections and friend requests.
/// </summary>
public class UserConnectionRepository : IUserConnectionRepository
{
    private readonly BioDbContext _ctx;

    public UserConnectionRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<UserConnection?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.UserConnections
            .Include(c => c.Requester)
            .Include(c => c.Addressee)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<UserConnection?> GetExistingConnectionAsync(
        Guid requesterId, Guid addresseeId, CancellationToken ct)
        => await _ctx.UserConnections
            .Include(c => c.Requester)
            .Include(c => c.Addressee)
            .FirstOrDefaultAsync(c =>
                c.RequesterId == requesterId && c.AddresseeId == addresseeId, ct);

    public async Task<(IReadOnlyList<UserConnection> Items, int TotalCount)> GetMyConnectionsAsync(
        Guid userId, string? status, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.UserConnections
            .Include(c => c.Requester)
            .Include(c => c.Addressee)
            .Where(c => c.RequesterId == userId || c.AddresseeId == userId);

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(c => c.Status == status);

        q = q.OrderByDescending(c => c.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<(IReadOnlyList<UserConnection> Items, int TotalCount)> GetPendingRequestsAsync(
        Guid addresseeId, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.UserConnections
            .Include(c => c.Requester)
            .Include(c => c.Addressee)
            .Where(c => c.AddresseeId == addresseeId && c.Status == "Pending")
            .OrderByDescending(c => c.CreatedAt);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task AddAsync(UserConnection connection, CancellationToken ct)
        => await _ctx.UserConnections.AddAsync(connection, ct);

    public async Task DeleteAsync(UserConnection connection, CancellationToken ct)
    {
        _ctx.UserConnections.Remove(connection);
        await Task.CompletedTask;
    }
}

/// <summary>
/// Repository for direct messaging threads and messages.
/// </summary>
public class DirectThreadRepository : IDirectThreadRepository
{
    private readonly BioDbContext _ctx;

    public DirectThreadRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<DirectThread?> GetByIdWithParticipantsAsync(Guid threadId, CancellationToken ct)
        => await _ctx.DirectThreads
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(t => t.Id == threadId, ct);

    public async Task<DirectThread?> GetDirectThreadBetweenUsersAsync(
        Guid userAId, Guid userBId, CancellationToken ct)
        => await _ctx.DirectThreads
            .Include(t => t.Participants)
            .Where(t => t.ThreadType == "Direct"
                && t.Participants.Any(p => p.UserId == userAId && p.LeftAt == null)
                && t.Participants.Any(p => p.UserId == userBId && p.LeftAt == null))
            .FirstOrDefaultAsync(ct);

    public async Task<(IReadOnlyList<DirectThread> Items, int TotalCount)> GetMyThreadsAsync(
        Guid userId, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.DirectThreads
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Where(t => t.Participants.Any(p => p.UserId == userId && p.LeftAt == null))
            .OrderByDescending(t => t.UpdatedAt ?? t.CreatedAt);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<(IReadOnlyList<DirectMessage> Items, int TotalCount)> GetMessagesByThreadAsync(
        Guid threadId, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.DirectMessages
            .Include(m => m.SenderUser)
            .Include(m => m.Reads)
            .Where(m => m.ThreadId == threadId)
            .OrderByDescending(m => m.CreatedAt);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct)
        => await _ctx.DirectMessages
            .Where(m =>
                !m.IsDeleted &&
                m.SenderUserId != userId &&
                m.Thread.Participants.Any(p => p.UserId == userId && p.LeftAt == null) &&
                !m.Reads.Any(r => r.UserId == userId))
            .CountAsync(ct);

    public async Task<bool> IsParticipantAsync(Guid threadId, Guid userId, CancellationToken ct)
        => await _ctx.DirectThreadParticipants
            .AnyAsync(p => p.ThreadId == threadId && p.UserId == userId && p.LeftAt == null, ct);

    public async Task AddThreadAsync(DirectThread thread, CancellationToken ct)
        => await _ctx.DirectThreads.AddAsync(thread, ct);

    public async Task AddMessageAsync(DirectMessage message, CancellationToken ct)
        => await _ctx.DirectMessages.AddAsync(message, ct);

    public async Task AddParticipantAsync(DirectThreadParticipant participant, CancellationToken ct)
        => await _ctx.DirectThreadParticipants.AddAsync(participant, ct);

    public async Task AddMessageReadAsync(DirectMessageRead read, CancellationToken ct)
        => await _ctx.DirectMessageReads.AddAsync(read, ct);

    public async Task<List<DirectMessage>> GetUnreadMessagesAsync(
        Guid threadId, Guid userId, CancellationToken ct)
        => await _ctx.DirectMessages
            .Where(m =>
                m.ThreadId == threadId &&
                !m.IsDeleted &&
                m.SenderUserId != userId &&
                !m.Reads.Any(r => r.UserId == userId))
            .ToListAsync(ct);

    public async Task<bool> MessageReadExistsAsync(Guid messageId, Guid userId, CancellationToken ct)
        => await _ctx.DirectMessageReads
            .AnyAsync(r => r.MessageId == messageId && r.UserId == userId, ct);
}
