using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

public static partial class BioDbContextMockSeeder
{
    /// <summary>
    /// Seeds the additional populations on top of the one-per-role base users:
    /// 5 new sellers (ENTREPRENEUR), 4 new community users (COMMUNITY) and 20 buyers (BUYER),
    /// each with role assignments and at least one shipping address.
    /// </summary>
    internal static void SeedMockUsers(this ModelBuilder modelBuilder, MockSeedContext ctx)
    {
        var users = new List<object>();
        var userRoles = new List<object>();
        var addresses = new List<object>();

        // ── 5 new sellers (ENTREPRENEUR) — SellerIds[0] is the base entrepreneur ──
        var sellerNames = new[]
        {
            "Reforestadora Los Nevados",
            "Herbario Páramo Vivo",
            "Aves del Eje Cafetero",
            "Alas de Caldas Lepidópteros",
            "Corozo del Magdalena",
        };
        for (int i = 0; i < 5; i++)
        {
            var id = ctx.SellerIds[i + 1];
            users.Add(NewUser(id, $"vendedor{i + 1}@biocommerce.com", sellerNames[i], ctx,
                phone: $"+57312{i:D7}", lastLogin: ctx.SeedDate.AddDays(-(2 + i))));
            userRoles.Add(NewRole(id, MockSeedContext.EntrepreneurRoleId, ctx));
        }

        // ── 4 new community users (COMMUNITY) — CommunityIds[0] is the base user ──
        var communityNames = new[]
        {
            "Resguardo Indígena La Montaña",
            "Asociación de Mujeres Tejedoras",
            "Colectivo Saberes del Café",
            "Guardianes del Páramo",
        };
        for (int i = 0; i < 4; i++)
        {
            var id = ctx.CommunityIds[i + 1];
            users.Add(NewUser(id, $"comunidad{i + 1}@biocommerce.com", communityNames[i], ctx,
                phone: $"+57313{i:D7}", lastLogin: ctx.SeedDate.AddDays(-(3 + i))));
            userRoles.Add(NewRole(id, MockSeedContext.CommunityRoleId, ctx));
        }

        // ── 20 buyers (BUYER) + addresses ────────────────────────────────────
        var firstNames = new[] { "Carlos", "María", "Juan", "Ana", "Luis", "Laura", "Andrés", "Daniela", "Jorge", "Camila", "Diego", "Valentina", "Pedro", "Sofía", "Miguel", "Isabella", "José", "Mariana", "Fernando", "Lucía" };
        var lastNames = new[] { "Gómez", "Rodríguez", "López", "Martínez", "Pérez", "García", "Sánchez", "Romero", "Torres", "Ruiz", "Ramírez", "Flórez", "Benítez", "Herrera", "Medina", "Rojas", "Díaz", "Castro", "Ortiz", "Silva" };
        var cities = new[] { "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Manizales", "Pereira", "Santa Marta", "Cúcuta" };
        var depts = new[] { "Cundinamarca", "Antioquia", "Valle del Cauca", "Atlántico", "Bolívar", "Santander", "Caldas", "Risaralda", "Magdalena", "Norte de Santander" };

        for (int i = 0; i < 20; i++)
        {
            var id = ctx.BuyerIds[i];
            var name = $"{firstNames[i]} {lastNames[i]}";
            users.Add(NewUser(id, $"buyer{i + 1}@example.com", name, ctx,
                phone: $"+57311{i:D7}", lastLogin: ctx.SeedDate.AddDays(-(1 + (i % 25)))));
            userRoles.Add(NewRole(id, MockSeedContext.BuyerRoleId, ctx));

            // Default shipping address.
            addresses.Add(new
            {
                Id = ctx.BuyerDefaultAddress[id],
                UserId = id,
                AddressType = "Shipping",
                RecipientName = name,
                StreetLine1 = $"Calle {i + 10} # {i + 20} - {i + 30}",
                StreetLine2 = $"Apto {i + 1:D2}1",
                City = cities[i % cities.Length],
                Department = depts[i % depts.Length],
                PostalCode = $"11{i:D4}",
                Country = "CO",
                PhoneNumber = $"+57311{i:D7}",
                IsDefault = true,
                CreatedAt = ctx.SeedDate,
            });

            // Every third buyer also has a billing address.
            if (i % 3 == 0)
            {
                addresses.Add(new
                {
                    Id = MockSeedContext.Det(10, 100 + i),
                    UserId = id,
                    AddressType = "Billing",
                    RecipientName = name,
                    StreetLine1 = $"Carrera {i + 5} # {i + 8} - {i + 12}",
                    StreetLine2 = (string?)null,
                    City = cities[(i + 3) % cities.Length],
                    Department = depts[(i + 3) % depts.Length],
                    PostalCode = $"22{i:D4}",
                    Country = "CO",
                    PhoneNumber = $"+57311{i:D7}",
                    IsDefault = false,
                    CreatedAt = ctx.SeedDate,
                });
            }
        }

        modelBuilder.Entity<User>().HasData(users);
        modelBuilder.Entity<UserRole>().HasData(userRoles);
        modelBuilder.Entity<Address>().HasData(addresses);
    }

    private static object NewUser(Guid id, string email, string fullName, MockSeedContext ctx, string phone, DateTime lastLogin) => new
    {
        Id = id,
        Email = email,
        FullName = fullName,
        PasswordHash = ctx.Hash,
        Salt = ctx.Salt,
        PhoneNumber = phone,
        IsActive = true,
        IsVerified = true,
        TwoFactorEnabled = false,
        LastLogin = (DateTime?)lastLogin,
        CreatedAt = ctx.SeedDate,
    };

    private static object NewRole(Guid userId, Guid roleId, MockSeedContext ctx) => new
    {
        UserId = userId,
        RoleId = roleId,
        AssignedAt = ctx.SeedDate,
    };
}
