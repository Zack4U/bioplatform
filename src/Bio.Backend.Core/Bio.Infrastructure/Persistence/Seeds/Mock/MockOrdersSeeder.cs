using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

public static partial class BioDbContextMockSeeder
{
    /// <summary>
    /// Seeds orders, order items, product reviews and favorites.
    /// Invariant: any buyer who reviews a product also has a <c>Delivered</c> order containing it
    /// (plus other items), so reviews are always backed by a real purchase.
    /// </summary>
    internal static void SeedMockOrders(this ModelBuilder modelBuilder, MockSeedContext ctx)
    {
        var orders = new List<object>();
        var orderItems = new List<object>();
        var reviews = new List<object>();
        var favorites = new List<object>();

        var random = new Random(20250101); // deterministic — only drives value choices, never ids
        int orderCounter = 1, itemCounter = 1, reviewCounter = 1, favCounter = 1;
        var products = ctx.Products;

        // Builds one order (+items) and returns its id. Product indices are 0-based into ctx.Products.
        Guid AddOrder(Guid buyerId, Guid addressId, string status, int daysAgo, IEnumerable<int> productIdx)
        {
            var orderId = MockSeedContext.Det(13, orderCounter);
            decimal subtotal = 0m;
            foreach (var idx in productIdx.Distinct())
            {
                var p = products[idx];
                int qty = random.Next(1, 4);
                decimal lineTotal = p.SellPrice * qty;
                subtotal += lineTotal;
                orderItems.Add(new
                {
                    Id = MockSeedContext.Det(14, itemCounter++),
                    OrderId = orderId,
                    ProductId = p.Id,
                    Quantity = qty,
                    UnitPrice = p.SellPrice,
                    TotalPrice = lineTotal,
                });
            }

            decimal shipping = subtotal >= 100000m ? 0m : 9000m;
            bool paid = status is "Delivered" or "Shipped" or "Processing";
            var createdAt = ctx.SeedDate.AddDays(-daysAgo);
            var orderNumber = $"ORD-2025-{orderCounter:D5}";

            orders.Add(new
            {
                Id = orderId,
                OrderNumber = orderNumber,
                BuyerId = buyerId,
                ShippingAddressId = (Guid?)addressId,
                BillingAddressId = (Guid?)addressId,
                TotalAmount = subtotal + shipping,
                SubtotalAmount = subtotal,
                TaxAmount = 0m,
                ShippingAmount = shipping,
                DiscountAmount = 0m,
                Status = status,
                PaymentMethod = new[] { "CreditCard", "PSE", "Nequi" }[orderCounter % 3],
                TransactionRef = paid ? $"TXN-{orderNumber}" : null,
                CreatedAt = createdAt,
            });
            orderCounter++;
            return orderId;
        }

        var reviewComments = new[]
        {
            "Excelente calidad, totalmente recomendado. Apoya a las comunidades locales.",
            "Me encantó el producto, llegó muy bien empacado y el envío fue rápido.",
            "Tal como se describe. Volveré a comprar sin duda.",
            "Muy buen producto, se nota el cuidado artesanal y la trazabilidad.",
            "Una maravilla de la biodiversidad colombiana. Cinco estrellas.",
            "Buena relación calidad-precio, aunque el envío tardó un poco.",
        };

        // ── Reviewer buyers (first 10) ───────────────────────────────────────
        for (int i = 0; i < 10; i++)
        {
            var buyerId = ctx.BuyerIds[i];
            var addr = ctx.BuyerDefaultAddress[buyerId];

            int reviewCount = 2 + (i % 2); // 2 or 3 reviewed products
            var reviewIdx = new List<int>();
            for (int r = 0; r < reviewCount; r++)
                reviewIdx.Add((i * 3 + r * 7 + 1) % products.Count);
            reviewIdx = reviewIdx.Distinct().ToList();

            // Delivered order that contains every reviewed product (+ one extra item).
            var orderItemsIdx = new List<int>(reviewIdx) { (i * 5 + 4) % products.Count };
            var deliveredOrderId = AddOrder(buyerId, addr, "Delivered", daysAgo: 40 - i, orderItemsIdx);

            // Reviews for the reviewed products.
            foreach (var idx in reviewIdx)
            {
                var p = products[idx];
                int rating = 4 + ((i + idx) % 2); // 4 or 5
                bool reported = reviewCounter % 9 == 0; // a couple of flagged reviews for moderation
                reviews.Add(new
                {
                    Id = MockSeedContext.Det(15, reviewCounter),
                    ProductId = p.Id,
                    UserId = buyerId,
                    Rating = rating,
                    Title = rating == 5 ? "Producto excelente" : "Muy buen producto",
                    Comment = reviewComments[reviewCounter % reviewComments.Length],
                    IsReported = reported,
                    ReportReason = reported ? "Posible reseña no relacionada con el producto." : null,
                    ReportedById = reported ? (Guid?)p.SellerId : null,
                    ReportedAt = reported ? (DateTime?)ctx.SeedDate.AddDays(-(10 - i)) : null,
                    CreatedAt = ctx.SeedDate.AddDays(-(33 - i)),
                });
                reviewCounter++;
            }

            // Every other reviewer also has a second, non-reviewed order.
            if (i % 2 == 0)
                AddOrder(buyerId, addr, "Shipped", daysAgo: 12 - (i % 5),
                    new[] { (i * 2 + 9) % products.Count, (i * 2 + 14) % products.Count });
        }

        // ── Non-reviewer buyers (10..19) — 1 to 3 orders, varied statuses ────
        var statuses = new[] { "Delivered", "Shipped", "Processing", "Pending", "Cancelled" };
        for (int i = 10; i < 20; i++)
        {
            var buyerId = ctx.BuyerIds[i];
            var addr = ctx.BuyerDefaultAddress[buyerId];
            int numOrders = 1 + (i % 3);
            for (int o = 0; o < numOrders; o++)
            {
                var status = statuses[(i + o) % statuses.Length];
                var idxs = new[] { (i * 3 + o) % products.Count, (i * 3 + o + 11) % products.Count };
                AddOrder(buyerId, addr, status, daysAgo: 30 - (o * 9), idxs);
            }
        }

        // ── Favorites — every buyer favorites a few products (+ some species) ─
        for (int i = 0; i < 20; i++)
        {
            var buyerId = ctx.BuyerIds[i];
            int favCount = 2 + (i % 3); // 2..4 products
            var seen = new HashSet<int>();
            for (int f = 0; f < favCount; f++)
            {
                int idx = (i * 4 + f * 6 + 2) % products.Count;
                if (!seen.Add(idx)) continue;
                favorites.Add(new
                {
                    Id = MockSeedContext.Det(16, favCounter++),
                    UserId = buyerId,
                    TargetType = "Product",
                    TargetId = products[idx].Id,
                    CreatedAt = ctx.SeedDate.AddDays(-(i % 20)),
                });
            }

            // Half the buyers also favorite a species (logical FK to PostgreSQL).
            if (i % 2 == 0)
            {
                var sp = ctx.Species[i % ctx.Species.Count];
                favorites.Add(new
                {
                    Id = MockSeedContext.Det(16, favCounter++),
                    UserId = buyerId,
                    TargetType = "Species",
                    TargetId = sp.Id,
                    CreatedAt = ctx.SeedDate.AddDays(-(i % 15)),
                });
            }
        }

        modelBuilder.Entity<Order>().HasData(orders);
        modelBuilder.Entity<OrderItem>().HasData(orderItems);
        modelBuilder.Entity<ProductReview>().HasData(reviews);
        modelBuilder.Entity<Favorite>().HasData(favorites);
    }
}
