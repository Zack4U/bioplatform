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

    /// Collection of security roles in the system.
    public DbSet<Role> Roles { get; set; }

    /// Collection of registered users in the system.
    public DbSet<User> Users { get; set; }

    /// Collection of user-role assignments.
    public DbSet<UserRole> UserRoles { get; set; }

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

            // Ensures that no duplicate phone numbers exist, ignoring nulls and empty strings
            entity.HasIndex(u => u.PhoneNumber)
                .IsUnique()
                .HasFilter("[PhoneNumber] IS NOT NULL AND [PhoneNumber] <> ''");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description); // Removes MaxLength constraint, maps to NVARCHAR(MAX)

            // Ensures that no duplicate role names exist
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });
        });
    }
}
