using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

public static class BioDbContextMockSeeder
{
    public static void SeedMockData(this ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        
        // 1. Categories
        var catFood = new { Id = 1, Name = "Alimentación Viva y Superalimentos" };
        var catHoney = new { Id = 2, Name = "Mieles y Derivados Apícolas" };
        var catCosmetics = new { Id = 3, Name = "Cosmética Natural y Botánica" };
        var catCrafts = new { Id = 4, Name = "Artesanías y Saberes Tradicionales" };
        var catOils = new { Id = 5, Name = "Aceites Esenciales y Extractos" };
        var catEco = new { Id = 6, Name = "Servicios Ecoturísticos" };
        var catSeeds = new { Id = 7, Name = "Semillas y Plantas Nativas" };

        modelBuilder.Entity<ProductCategory>().HasData(
            catFood, catHoney, catCosmetics, catCrafts, catOils, catEco, catSeeds
        );

        // Password hash
        byte[] saltBytes = new byte[16];
        for (int i = 0; i < 16; i++) saltBytes[i] = (byte)(i + 1);
        string salt = Convert.ToBase64String(saltBytes);
        byte[] hashBytes = Rfc2898DeriveBytes.Pbkdf2("DevPassword123!", saltBytes, 100000, HashAlgorithmName.SHA256, 32);
        string hash = Convert.ToBase64String(hashBytes);

        var buyerRoleId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var entrepreneurId = Guid.Parse("A3333333-3333-3333-3333-333333333333");

        // 2. Users (Buyers)
        var users = new List<object>();
        var userRoles = new List<object>();
        var addresses = new List<object>();
        
        var firstNames = new[] { "Carlos", "María", "Juan", "Ana", "Luis", "Laura", "Andrés", "Daniela", "Jorge", "Camila", "Diego", "Valentina", "Pedro", "Sofia", "Miguel", "Isabella", "José", "Mariana", "Fernando", "Lucia" };
        var lastNames = new[] { "Gómez", "Rodríguez", "López", "Martínez", "Pérez", "García", "Sánchez", "Romero", "Torres", "Ruiz", "Ramírez", "Flores", "Benítez", "Herrera", "Medina", "Rojas", "Díaz", "Castro", "Ortiz", "Silva" };
        var cities = new[] { "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Manizales", "Pereira", "Santa Marta", "Cúcuta" };
        var depts = new[] { "Cundinamarca", "Antioquia", "Valle del Cauca", "Atlántico", "Bolívar", "Santander", "Caldas", "Risaralda", "Magdalena", "Norte de Santander" };
        
        var buyerIds = new List<Guid>();
        var userAddresses = new Dictionary<Guid, Guid>();

        for (int i = 0; i < 20; i++)
        {
            var userId = Guid.NewGuid();
            buyerIds.Add(userId);
            
            var name = $"{firstNames[i]} {lastNames[i]}";
            var email = $"buyer{i+1}@example.com";
            
            users.Add(new { 
                Id = userId, 
                Email = email, 
                FullName = name, 
                PasswordHash = hash, 
                Salt = salt, 
                PhoneNumber = $"+57311{i:D7}", 
                IsActive = true, 
                IsVerified = true, 
                TwoFactorEnabled = false, 
                CreatedAt = seedDate 
            });

            userRoles.Add(new { UserId = userId, RoleId = buyerRoleId, AssignedAt = seedDate });

            var addressId = Guid.NewGuid();
            userAddresses[userId] = addressId;
            addresses.Add(new {
                Id = addressId,
                UserId = userId,
                AddressType = "Shipping",
                RecipientName = name,
                StreetLine1 = $"Calle {i+10} # {i+20} - {i+30}",
                StreetLine2 = $"Apto {i}01",
                City = cities[i % cities.Length],
                Department = depts[i % depts.Length],
                PostalCode = $"11{i:D4}",
                Country = "CO",
                PhoneNumber = $"+57311{i:D7}",
                IsDefault = true,
                CreatedAt = seedDate
            });
        }

        modelBuilder.Entity<User>().HasData(users);
        modelBuilder.Entity<UserRole>().HasData(userRoles);
        modelBuilder.Entity<Address>().HasData(addresses);

        // 3. Products
        var products = new List<object>();
        var productIds = new List<Guid>();
        
        var productDefinitions = new[]
        {
            new { Cat = 1, Name = "Harina de Coca Tradicional", Slug = "harina-coca-tradicional", Price = 25000m, Sku = "HC-001" },
            new { Cat = 1, Name = "Cacao Amazónico al 70%", Slug = "cacao-amazonico-70", Price = 18500m, Sku = "CA-070" },
            new { Cat = 2, Name = "Miel de Abejas Angelitas (Meliponas)", Slug = "miel-angelitas", Price = 45000m, Sku = "MA-001" },
            new { Cat = 2, Name = "Polen Orgánico de Bosque Seco", Slug = "polen-organico", Price = 32000m, Sku = "PO-001" },
            new { Cat = 3, Name = "Bálsamo Labial de Copoazú", Slug = "balsamo-copoazu", Price = 15000m, Sku = "BC-001" },
            new { Cat = 3, Name = "Crema de Sacha Inchi", Slug = "crema-sacha-inchi", Price = 38000m, Sku = "CS-001" },
            new { Cat = 4, Name = "Canasto en Rollo de Guacamayas", Slug = "canasto-guacamayas", Price = 120000m, Sku = "CG-001" },
            new { Cat = 4, Name = "Mochila Arhuaca Tradicional", Slug = "mochila-arhuaca", Price = 250000m, Sku = "MA-002" },
            new { Cat = 5, Name = "Aceite de Cacay Puro", Slug = "aceite-cacay", Price = 85000m, Sku = "AC-001" },
            new { Cat = 5, Name = "Aceite Esencial de Palo Santo", Slug = "aceite-palo-santo", Price = 60000m, Sku = "AP-001" },
            new { Cat = 6, Name = "Recorrido Avistamiento de Aves Río Claro", Slug = "recorrido-aves-rio-claro", Price = 150000m, Sku = "RC-001" },
            new { Cat = 6, Name = "Taller de Tintes Naturales", Slug = "taller-tintes", Price = 90000m, Sku = "TT-001" },
            new { Cat = 7, Name = "Semillas de Amaranto Andino", Slug = "semillas-amaranto", Price = 12000m, Sku = "SA-001" },
            new { Cat = 7, Name = "Plantas de Vainilla de la Orinoquía", Slug = "planta-vainilla", Price = 45000m, Sku = "PV-001" }
        };

        foreach (var pd in productDefinitions)
        {
            var pid = Guid.NewGuid();
            productIds.Add(pid);
            products.Add(new {
                Id = pid,
                Slug = pd.Slug,
                EntrepreneurId = entrepreneurId,
                BaseSpeciesId = Guid.NewGuid(), // Fake PostgreSQL UUID
                CategoryId = pd.Cat,
                Name = pd.Name,
                Description = $"Descripción detallada de {pd.Name}, elaborado por comunidades locales con prácticas sostenibles. Promoviendo la conservación de la biodiversidad colombiana.",
                BasePrice = pd.Price * 0.8m,
                SellPrice = pd.Price,
                StockQuantity = 50,
                Sku = pd.Sku,
                IsActive = true,
                CreatedAt = seedDate
            });
        }

        modelBuilder.Entity<Product>().HasData(products);

        // 4. Orders, OrderItems & Reviews
        var orders = new List<object>();
        var orderItems = new List<object>();
        var reviews = new List<object>();

        var random = new Random(12345); // Deterministic to avoid EF Migration conflicts

        int orderCounter = 1;
        for (int i = 0; i < productIds.Count; i++)
        {
            var productId = productIds[i];
            var pd = productDefinitions[i];

            // 1 to 3 reviews per product
            int reviewCount = random.Next(1, 4);
            
            for (int r = 0; r < reviewCount; r++)
            {
                var buyerId = buyerIds[random.Next(buyerIds.Count)];
                var addressId = userAddresses[buyerId];
                var orderId = Guid.NewGuid();
                var qty = random.Next(1, 4);

                // Create Order
                orders.Add(new {
                    Id = orderId,
                    OrderNumber = $"ORD-2025-{orderCounter:D5}",
                    BuyerId = buyerId,
                    ShippingAddressId = addressId,
                    BillingAddressId = addressId,
                    TotalAmount = pd.Price * qty,
                    SubtotalAmount = pd.Price * qty,
                    TaxAmount = 0m,
                    ShippingAmount = 0m,
                    DiscountAmount = 0m,
                    Status = "Delivered",
                    PaymentMethod = "CreditCard",
                    CreatedAt = seedDate.AddDays(orderCounter)
                });

                // Create OrderItem
                orderItems.Add(new {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    ProductId = productId,
                    Quantity = qty,
                    UnitPrice = pd.Price,
                    TotalPrice = pd.Price * qty
                });

                // Create Review
                int rating = random.Next(4, 6); // 4 or 5 stars
                var comments = new[] { "Excelente calidad, muy recomendado.", "Me encantó este producto, apoya a las comunidades.", "El envío fue rápido y el producto es tal como se describe.", "Muy bueno, lo compraré de nuevo.", "Increíble, una maravilla de la biodiversidad colombiana." };
                reviews.Add(new {
                    Id = Guid.NewGuid(),
                    ProductId = productId,
                    UserId = buyerId,
                    Rating = rating,
                    Title = "Muy buen producto",
                    Comment = comments[random.Next(comments.Length)],
                    CreatedAt = seedDate.AddDays(orderCounter + 5)
                });

                orderCounter++;
            }
        }

        modelBuilder.Entity<Order>().HasData(orders);
        modelBuilder.Entity<OrderItem>().HasData(orderItems);
        modelBuilder.Entity<ProductReview>().HasData(reviews);
    }
}
