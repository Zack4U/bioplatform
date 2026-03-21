using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

public static class BioDbContextSeeder
{
    public static void SeedBaseData(this ModelBuilder modelBuilder)
    {
        // 1. Roles based on 03-Data_Dictionary.md
        var adminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var researcherRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var entrepreneurRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var communityRoleId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var buyerRoleId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var authorityRoleId = Guid.Parse("66666666-6666-6666-6666-666666666666");

        var seedDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<Role>().HasData(
            new { Id = adminRoleId, Name = "ADMIN", Description = "System Administrator", CreatedAt = seedDate },
            new { Id = researcherRoleId, Name = "RESEARCHER", Description = "Can validate species and upload images", CreatedAt = seedDate },
            new { Id = entrepreneurRoleId, Name = "ENTREPRENEUR", Description = "Creates products and sells in marketplace", CreatedAt = seedDate },
            new { Id = communityRoleId, Name = "COMMUNITY", Description = "Shares traditional knowledge and produces", CreatedAt = seedDate },
            new { Id = buyerRoleId, Name = "BUYER", Description = "Searches for sustainable products", CreatedAt = seedDate },
            new { Id = authorityRoleId, Name = "AUTHORITY", Description = "Verifies permits and sustainability", CreatedAt = seedDate }
        );

        // 2. Deterministic Hash Generation for "DevPassword123!"
        byte[] saltBytes = new byte[16];
        for (int i = 0; i < 16; i++) saltBytes[i] = (byte)(i + 1);
        string salt = Convert.ToBase64String(saltBytes);
        
        byte[] hashBytes = Rfc2898DeriveBytes.Pbkdf2(
            "DevPassword123!", 
            saltBytes, 
            100000, 
            HashAlgorithmName.SHA256, 
            32);
        string hash = Convert.ToBase64String(hashBytes);

        // 3. User Generation (One per Role, using anonymous types)
        modelBuilder.Entity<User>().HasData(
            new { Id = Guid.Parse("A1111111-1111-1111-1111-111111111111"), Email = "admin@biocommerce.com", FullName = "Admin User", PasswordHash = hash, Salt = salt, PhoneNumber = "+573000000001", IsActive = true, IsVerified = true, TwoFactorEnabled = false, CreatedAt = seedDate },
            new { Id = Guid.Parse("A2222222-2222-2222-2222-222222222222"), Email = "researcher@biocommerce.com", FullName = "Researcher User", PasswordHash = hash, Salt = salt, PhoneNumber = "+573000000002", IsActive = true, IsVerified = true, TwoFactorEnabled = false, CreatedAt = seedDate },
            new { Id = Guid.Parse("A3333333-3333-3333-3333-333333333333"), Email = "entrepreneur@biocommerce.com", FullName = "Entrepreneur User", PasswordHash = hash, Salt = salt, PhoneNumber = "+573000000003", IsActive = true, IsVerified = true, TwoFactorEnabled = false, CreatedAt = seedDate },
            new { Id = Guid.Parse("A4444444-4444-4444-4444-444444444444"), Email = "community@biocommerce.com", FullName = "Community User", PasswordHash = hash, Salt = salt, PhoneNumber = "+573000000004", IsActive = true, IsVerified = true, TwoFactorEnabled = false, CreatedAt = seedDate },
            new { Id = Guid.Parse("A5555555-5555-5555-5555-555555555555"), Email = "buyer@biocommerce.com", FullName = "Buyer User", PasswordHash = hash, Salt = salt, PhoneNumber = "+573000000005", IsActive = true, IsVerified = true, TwoFactorEnabled = false, CreatedAt = seedDate },
            new { Id = Guid.Parse("A6666666-6666-6666-6666-666666666666"), Email = "authority@biocommerce.com", FullName = "Authority User", PasswordHash = hash, Salt = salt, PhoneNumber = "+573000000006", IsActive = true, IsVerified = true, TwoFactorEnabled = false, CreatedAt = seedDate }
        );

        // 4. User-Role Assignments
        modelBuilder.Entity<UserRole>().HasData(
            new { UserId = Guid.Parse("A1111111-1111-1111-1111-111111111111"), RoleId = adminRoleId },
            new { UserId = Guid.Parse("A2222222-2222-2222-2222-222222222222"), RoleId = researcherRoleId },
            new { UserId = Guid.Parse("A3333333-3333-3333-3333-333333333333"), RoleId = entrepreneurRoleId },
            new { UserId = Guid.Parse("A4444444-4444-4444-4444-444444444444"), RoleId = communityRoleId },
            new { UserId = Guid.Parse("A5555555-5555-5555-5555-555555555555"), RoleId = buyerRoleId },
            new { UserId = Guid.Parse("A6666666-6666-6666-6666-666666666666"), RoleId = authorityRoleId }
        );
    }
}
