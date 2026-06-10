namespace Bio.Domain.Interfaces;

/// <summary>
/// Generic distributed cache service (backed by Redis in production).
/// Provides strongly-typed get/set/remove operations with optional TTL.
/// </summary>
public interface ICacheService
{
    /// <summary>Tries to retrieve a cached value. Returns null on cache miss.</summary>
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class;

    /// <summary>Stores a value in cache. If expiry is null, a sensible default TTL is used.</summary>
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default) where T : class;

    /// <summary>Removes a single key from the cache.</summary>
    Task RemoveAsync(string key, CancellationToken ct = default);

    /// <summary>
    /// Removes all keys matching the given prefix pattern.
    /// E.g. prefix = "products:public:" removes all paginated product listings.
    /// </summary>
    Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default);
}
