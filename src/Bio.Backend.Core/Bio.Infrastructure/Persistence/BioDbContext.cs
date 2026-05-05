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

    // --- Identity & Access Management ---
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<UserRole> UserRoles { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

    // --- Marketplace ---
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<ProductCategory> ProductCategories { get; set; } = null!;
    public DbSet<ProductImage> ProductImages { get; set; } = null!;
    public DbSet<ProductReview> ProductReviews { get; set; } = null!;
    public DbSet<Certification> Certifications { get; set; } = null!;

    // --- Orders & Transactions ---
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;

    // --- Legal & Compliance ---
    public DbSet<AbsPermit> AbsPermits { get; set; } = null!;
    public DbSet<TraceabilityBatch> TraceabilityBatches { get; set; } = null!;

    // --- User Features ---
    public DbSet<Address> Addresses { get; set; } = null!;
    public DbSet<Favorite> Favorites { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<ActivityLog> ActivityLogs { get; set; } = null!;

    // --- Community & Networking ---
    public DbSet<CommunityPost> CommunityPosts { get; set; } = null!;
    public DbSet<CommunityPostComment> CommunityPostComments { get; set; } = null!;
    public DbSet<CommunityReaction> CommunityReactions { get; set; } = null!;
    public DbSet<UserConnection> UserConnections { get; set; } = null!;
    public DbSet<DirectThread> DirectThreads { get; set; } = null!;
    public DbSet<DirectThreadParticipant> DirectThreadParticipants { get; set; } = null!;
    public DbSet<DirectMessage> DirectMessages { get; set; } = null!;
    public DbSet<DirectMessageRead> DirectMessageReads { get; set; } = null!;

    /// Configures the data model and mapping rules using Fluent API.
    /// Executed when the model for the context is being initialized.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // =====================================================================
        // IDENTITY & ACCESS MANAGEMENT
        // =====================================================================

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Salt).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.TwoFactorSecret).HasMaxLength(100);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(u => u.PhoneNumber)
                .IsUnique()
                .HasFilter("[PhoneNumber] IS NOT NULL AND [PhoneNumber] <> ''");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });
            entity.HasOne(ur => ur.User)
                .WithMany()
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(ur => ur.Role)
                .WithMany()
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
            entity.HasIndex(e => e.Token);
            entity.HasOne(rt => rt.User)
                .WithMany()
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // =====================================================================
        // MARKETPLACE
        // =====================================================================

        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(450);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.EntrepreneurId);
            entity.HasIndex(e => e.BaseSpeciesId); // Logical FK to PostgreSQL
            entity.Property(e => e.BasePrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.SellPrice).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Entrepreneur)
                  .WithMany()
                  .HasForeignKey(e => e.EntrepreneurId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Category)
                  .WithMany(pc => pc.Products)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);
            entity.Property(e => e.AltText).HasMaxLength(200);
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Images)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.ProductId);
        });

        modelBuilder.Entity<ProductReview>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Reviews)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Certification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.CertificationType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.IssuingBody).IsRequired().HasMaxLength(150);
            entity.Property(e => e.CertificateNumber).HasMaxLength(100);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.DocumentUrl).HasMaxLength(500);
            entity.Property(e => e.LogoUrl).HasMaxLength(500);
            entity.Property(e => e.VerificationCode).HasMaxLength(100);
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Certifications)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.CertificationType);
        });

        // =====================================================================
        // ORDERS & TRANSACTIONS
        // =====================================================================

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BuyerId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.Property(e => e.Status).IsRequired().HasMaxLength(450);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.SubtotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.ShippingAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Buyer)
                  .WithMany()
                  .HasForeignKey(e => e.BuyerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ShippingAddress)
                  .WithMany()
                  .HasForeignKey(e => e.ShippingAddressId)
                  .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.BillingAddress)
                  .WithMany()
                  .HasForeignKey(e => e.BillingAddressId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Order)
                  .WithMany(o => o.OrderItems)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Product)
                  .WithMany(p => p.OrderItems)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // =====================================================================
        // LEGAL & COMPLIANCE
        // =====================================================================

        modelBuilder.Entity<AbsPermit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SpeciesId); // Logical FK
            entity.HasIndex(e => e.ResolutionNumber).IsUnique();
            entity.HasOne(e => e.Entrepreneur)
                  .WithMany()
                  .HasForeignKey(e => e.EntrepreneurId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TraceabilityBatch>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BatchCode).IsUnique();
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.TraceabilityBatches)
                  .HasForeignKey(e => e.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // =====================================================================
        // USER FEATURES
        // =====================================================================

        modelBuilder.Entity<Address>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AddressType).IsRequired().HasMaxLength(20);
            entity.Property(e => e.RecipientName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.StreetLine1).IsRequired().HasMaxLength(200);
            entity.Property(e => e.StreetLine2).HasMaxLength(200);
            entity.Property(e => e.City).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Department).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PostalCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Country).IsRequired().HasMaxLength(10);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
        });

        modelBuilder.Entity<Favorite>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TargetType).IsRequired().HasMaxLength(20);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.TargetType, e.TargetId }).IsUnique();
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Message).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.NotificationType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ReferenceType).HasMaxLength(50);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsRead);
        });

        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ActorType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ActionType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ImpactLevel).IsRequired().HasMaxLength(20);
            entity.Property(e => e.TargetType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Summary).IsRequired().HasMaxLength(500);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(400);
            entity.HasOne(e => e.ActorUser)
                  .WithMany()
                  .HasForeignKey(e => e.ActorUserId)
                  .OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(e => e.ActorUserId);
            entity.HasIndex(e => e.ActionType);
            entity.HasIndex(e => e.ImpactLevel);
            entity.HasIndex(e => e.TargetType);
            entity.HasIndex(e => e.TargetId);
        });

        // =====================================================================
        // COMMUNITY & NETWORKING
        // =====================================================================

        modelBuilder.Entity<CommunityPost>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.HasOne(e => e.AuthorUser)
                  .WithMany()
                  .HasForeignKey(e => e.AuthorUserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.AuthorUserId);
            entity.HasIndex(e => e.Category);
        });

        modelBuilder.Entity<CommunityPostComment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Post)
                  .WithMany(p => p.Comments)
                  .HasForeignKey(e => e.PostId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.AuthorUser)
                  .WithMany()
                  .HasForeignKey(e => e.AuthorUserId)
                  .OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(e => e.AuthorUserId);
        });

        modelBuilder.Entity<CommunityReaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TargetType).IsRequired().HasMaxLength(20);
            entity.Property(e => e.ReactionType).IsRequired().HasMaxLength(10);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.TargetType);
            entity.HasIndex(e => e.TargetId);
            entity.HasIndex(e => new { e.UserId, e.TargetType, e.TargetId }).IsUnique();
        });

        modelBuilder.Entity<UserConnection>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.HasOne(e => e.Requester)
                  .WithMany()
                  .HasForeignKey(e => e.RequesterId)
                  .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.Addressee)
                  .WithMany()
                  .HasForeignKey(e => e.AddresseeId)
                  .OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(e => e.RequesterId);
            entity.HasIndex(e => e.AddresseeId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<DirectThread>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.ThreadType).IsRequired().HasMaxLength(20);
        });

        modelBuilder.Entity<DirectThreadParticipant>(entity =>
        {
            entity.HasKey(e => new { e.ThreadId, e.UserId });
            entity.HasOne(e => e.Thread)
                  .WithMany(t => t.Participants)
                  .HasForeignKey(e => e.ThreadId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<DirectMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Thread)
                  .WithMany(t => t.Messages)
                  .HasForeignKey(e => e.ThreadId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.SenderUser)
                  .WithMany()
                  .HasForeignKey(e => e.SenderUserId)
                  .OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(e => e.SenderUserId);
        });

        modelBuilder.Entity<DirectMessageRead>(entity =>
        {
            entity.HasKey(e => new { e.MessageId, e.UserId });
            entity.HasOne(e => e.Message)
                  .WithMany(m => m.Reads)
                  .HasForeignKey(e => e.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        // =====================================================================
        // SEED DATA
        // =====================================================================
        modelBuilder.SeedBaseData();
    }
}
