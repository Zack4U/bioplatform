using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

/// Database context for the BioPlatform platform.
/// Acts as the main bridge between domain entities and the SQL Server database.
public class BioDbContext : DbContext
{
    /// Initializes a new instance of <see cref="BioDbContext"/>.
    public BioDbContext(DbContextOptions<BioDbContext> options) : base(options)
    {
    }

    /// Collection of registered users in the system.
    /// Maps directly to the 'Users' table in the database.
    public DbSet<User> Users { get; set; }

    /// Configures the data model and mapping rules using Fluent API.
    /// Executed when the model for the context is being initialized.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            // Define the primary key
            entity.HasKey(e => e.Id);

            // Integrity and length rules for fields
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);

            // Ensures that no duplicate emails exist
            entity.HasIndex(e => e.Email).IsUnique();
        });
    }
}
