using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

/// <summary>
/// Orchestrates all development/demo mock data for the SQL Server context.
/// The seeder is split into deterministic, domain-focused partials (see the
/// <c>Seeds/Mock/</c> folder): users, catalog, orders, community and networking.
///
/// Every id and timestamp is derived from fixed inputs (see <see cref="MockSeedContext"/>),
/// so the generated <c>HasData</c> snapshot is stable across rebuilds and produces a single,
/// repeatable EF Core migration.
///
/// Species and species images live in PostgreSQL (ScientificDbContext) and are NOT seeded here;
/// products and ABS permits reference real <c>species.id</c> UUIDs via logical FKs.
/// </summary>
public static partial class BioDbContextMockSeeder
{
    public static void SeedMockData(this ModelBuilder modelBuilder)
    {
        var ctx = MockSeedContext.Build();

        modelBuilder.SeedMockUsers(ctx);        // sellers, community users, buyers, roles, addresses
        modelBuilder.SeedMockCatalog(ctx);      // categories, products, images, certifications, ABS permits
        modelBuilder.SeedMockOrders(ctx);       // orders, order items, reviews, favorites
        modelBuilder.SeedMockCommunity(ctx);    // community posts (HTML), comments, reactions
        modelBuilder.SeedMockNetworking(ctx);   // connections, direct threads, messages, reads
    }
}
