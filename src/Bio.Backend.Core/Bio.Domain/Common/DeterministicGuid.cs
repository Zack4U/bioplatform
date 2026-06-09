using System.Security.Cryptography;
using System.Text;

namespace Bio.Domain.Common;

/// <summary>
/// Deterministic UUID generation (RFC 4122 version 5: namespace + name, SHA-1).
///
/// Used to derive a STABLE species id from its scientific name so that every import of the
/// scientific catalog produces the same <c>species.id</c>. This lets cross-database logical FKs
/// (e.g. SQL Server <c>Product.BaseSpeciesId</c> → PostgreSQL <c>species.id</c>) stay valid across
/// re-imports without a manual id mapping table.
///
/// The output is RFC-canonical, so it matches Python's <c>uuid.uuid5(namespace, name)</c> for the
/// same namespace and name — useful if data-generation scripts ever need to precompute the same ids.
/// </summary>
public static class DeterministicGuid
{
    /// <summary>
    /// Fixed project namespace for biodiversity species ids.
    /// DO NOT CHANGE — changing it reassigns every species UUID and breaks all logical FKs.
    /// </summary>
    public static readonly Guid SpeciesNamespace = Guid.Parse("7d9a4e2c-1f3b-4a6d-9c8e-5b2f1a0d3e64");

    /// <summary>
    /// Stable species id = UUIDv5(<see cref="SpeciesNamespace"/>, normalized scientific name).
    /// The name is trimmed and lower-cased so casing/whitespace differences map to the same id.
    /// </summary>
    public static Guid ForSpecies(string scientificName)
        => Create(SpeciesNamespace, (scientificName ?? string.Empty).Trim().ToLowerInvariant());

    /// <summary>Creates an RFC 4122 version 5 (SHA-1) UUID from a namespace and a name.</summary>
    public static Guid Create(Guid namespaceId, string name)
    {
        byte[] nsBytes = namespaceId.ToByteArray();
        SwapByteOrder(nsBytes); // .NET Guid stores fields 1-3 little-endian → convert to RFC big-endian

        byte[] nameBytes = Encoding.UTF8.GetBytes(name);

        byte[] hash;
        using (var sha1 = SHA1.Create())
        {
            sha1.TransformBlock(nsBytes, 0, nsBytes.Length, null, 0);
            sha1.TransformFinalBlock(nameBytes, 0, nameBytes.Length);
            hash = sha1.Hash!;
        }

        byte[] newGuid = new byte[16];
        Array.Copy(hash, 0, newGuid, 0, 16);

        // Set version (5) in the high nibble of byte 6.
        newGuid[6] = (byte)((newGuid[6] & 0x0F) | (5 << 4));
        // Set variant (RFC 4122) in the two high bits of byte 8.
        newGuid[8] = (byte)((newGuid[8] & 0x3F) | 0x80);

        SwapByteOrder(newGuid); // RFC big-endian → .NET Guid layout
        return new Guid(newGuid);
    }

    private static void SwapByteOrder(byte[] guid)
    {
        Swap(guid, 0, 3);
        Swap(guid, 1, 2);
        Swap(guid, 4, 5);
        Swap(guid, 6, 7);
    }

    private static void Swap(byte[] guid, int left, int right)
        => (guid[left], guid[right]) = (guid[right], guid[left]);
}
