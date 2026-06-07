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
            var email = $"buyer{i + 1}@example.com";

            users.Add(new
            {
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
            addresses.Add(new
            {
                Id = addressId,
                UserId = userId,
                AddressType = "Shipping",
                RecipientName = name,
                StreetLine1 = $"Calle {i + 10} # {i + 20} - {i + 30}",
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
            products.Add(new
            {
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
                orders.Add(new
                {
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
                orderItems.Add(new
                {
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
                reviews.Add(new
                {
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

        // =====================================================================
        // COMMUNITY & NETWORKING MOCK DATA
        // =====================================================================

        // 1. User Connections (Networking)
        var connections = new List<object>();
        int connCounter = 1;

        // Base users connections
        connections.Add(new
        {
            Id = DeterministicGuid(1, connCounter++),
            RequesterId = Guid.Parse("A4444444-4444-4444-4444-444444444444"), // Community
            AddresseeId = Guid.Parse("A3333333-3333-3333-3333-333333333333"), // Entrepreneur
            Status = "Accepted",
            Message = "¡Hola! Me gustaría conectar para hablar sobre las prácticas tradicionales de cultivo.",
            CreatedAt = seedDate.AddDays(-20),
            RespondedAt = (DateTime?)seedDate.AddDays(-19)
        });

        connections.Add(new
        {
            Id = DeterministicGuid(1, connCounter++),
            RequesterId = Guid.Parse("A4444444-4444-4444-4444-444444444444"), // Community
            AddresseeId = Guid.Parse("A2222222-2222-2222-2222-222222222222"), // Researcher
            Status = "Accepted",
            Message = "Un saludo. Interesado en validar algunas especies de mi región.",
            CreatedAt = seedDate.AddDays(-15),
            RespondedAt = (DateTime?)seedDate.AddDays(-14)
        });

        connections.Add(new
        {
            Id = DeterministicGuid(1, connCounter++),
            RequesterId = Guid.Parse("A3333333-3333-3333-3333-333333333333"), // Entrepreneur
            AddresseeId = Guid.Parse("A2222222-2222-2222-2222-222222222222"), // Researcher
            Status = "Accepted",
            Message = "Hola, queremos certificar que nuestros productos provienen de fuentes biológicas validadas.",
            CreatedAt = seedDate.AddDays(-8),
            RespondedAt = (DateTime?)seedDate.AddDays(-7)
        });

        connections.Add(new
        {
            Id = DeterministicGuid(1, connCounter++),
            RequesterId = Guid.Parse("A5555555-5555-5555-5555-555555555555"), // Buyer
            AddresseeId = Guid.Parse("A3333333-3333-3333-3333-333333333333"), // Entrepreneur
            Status = "Accepted",
            Message = "¡Hola! Soy comprador interesado en tus productos ecológicos de Cacay.",
            CreatedAt = seedDate.AddDays(-5),
            RespondedAt = (DateTime?)seedDate.AddDays(-4)
        });

        connections.Add(new
        {
            Id = DeterministicGuid(1, connCounter++),
            RequesterId = Guid.Parse("A5555555-5555-5555-5555-555555555555"), // Buyer
            AddresseeId = Guid.Parse("A4444444-4444-4444-4444-444444444444"), // Community
            Status = "Accepted",
            Message = "Interesado en conocer más sobre la cosmética natural ancestral.",
            CreatedAt = seedDate.AddDays(-4),
            RespondedAt = (DateTime?)seedDate.AddDays(-3)
        });

        // Seed some auto-generated buyers connections
        for (int i = 0; i < 15; i++)
        {
            var reqId = buyerIds[i];
            var addId = buyerIds[(i + 3) % buyerIds.Count];
            if (reqId == addId) continue;

            string status = i % 5 == 0 ? "Pending" : (i % 5 == 1 ? "Rejected" : (i % 5 == 2 ? "Blocked" : "Accepted"));
            DateTime? respondedAt = status == "Pending" ? null : (DateTime?)seedDate.AddDays(-5 + i);

            connections.Add(new
            {
                Id = DeterministicGuid(1, connCounter++),
                RequesterId = reqId,
                AddresseeId = addId,
                Status = status,
                Message = $"¡Hola! Me gustaría conectar contigo para compartir saberes sobre biocomercio - Comprador {i}.",
                CreatedAt = seedDate.AddDays(-6),
                RespondedAt = respondedAt
            });
        }

        modelBuilder.Entity<UserConnection>().HasData(connections);

        // 2. Community Posts
        var posts = new List<object>();

        var p1 = new { Id = DeterministicGuid(2, 1), AuthorUserId = Guid.Parse("A4444444-4444-4444-4444-444444444444"), Title = "Uso tradicional de la Harina de Coca en las comunidades del Cauca", Category = "Tradición", Content = "La harina de coca ha sido utilizada ancestralmente por las comunidades indígenas del Cauca como alimento, medicina y elemento espiritual. En este post queremos compartir sus bondades nutricionales y cómo la producción sostenible ayuda a reactivar nuestra economía local. ¿Alguien ha probado las recetas tradicionales de pan de coca?", Status = "Published", IsPinned = true, CreatedAt = seedDate.AddDays(-20) };
        var p2 = new { Id = DeterministicGuid(2, 2), AuthorUserId = Guid.Parse("A2222222-2222-2222-2222-222222222222"), Title = "Estudio taxonómico de la polinización del Cacao Amazónico", Category = "Investigación", Content = "Compartimos nuestro último boletín científico sobre los agentes polinizadores del Theobroma cacao en el departamento de Caldas. Hemos identificado 3 especies de insectos clave que aumentan la productividad en un 30%. Pronto subiremos las imágenes validadas al repositorio científico.", Status = "Published", IsPinned = false, CreatedAt = seedDate.AddDays(-18) };
        var p3 = new { Id = DeterministicGuid(2, 3), AuthorUserId = Guid.Parse("A3333333-3333-3333-3333-333333333333"), Title = "Miel de Abejas Angelitas: Un superalimento en peligro", Category = "Conservación", Content = "La miel de meliponas (abejas angelitas) es valorada por sus propiedades medicinales y oftálmicas. Sin embargo, la deforestación pone en riesgo a estas polinizadoras sin aguijón. En nuestro apiario promovemos nidos técnicos en bosque nativo. ¿Cómo cuidan ustedes a las abejas en sus regiones?", Status = "Published", IsPinned = false, CreatedAt = seedDate.AddDays(-16) };
        var p4 = new { Id = DeterministicGuid(2, 4), AuthorUserId = Guid.Parse("A5555555-5555-5555-5555-555555555555"), Title = "Buscando proveedores de aceites esenciales puros en Caldas", Category = "Emprendimiento", Content = "Hola a todos. Estoy buscando contactar emprendimientos locales que produzcan aceite esencial de Palo Santo y Cacay con trazabilidad completa y de manera sostenible. Es para un proyecto de cosmética natural certificada. Agradezco información de contacto.", Status = "Published", IsPinned = false, CreatedAt = seedDate.AddDays(-14) };
        var p5 = new { Id = DeterministicGuid(2, 5), AuthorUserId = Guid.Parse("A6666666-6666-6666-6666-666666666666"), Title = "Guía técnica sobre permisos de acceso a recursos genéticos (ADB)", Category = "Educación", Content = "Recordamos a toda la comunidad de investigadores y emprendedores que para el uso comercial de especies nativas se debe tramitar el permiso de Acceso a Recursos Genéticos y Productos Derivados. En este post explicamos el paso a paso.", Status = "Published", IsPinned = false, CreatedAt = seedDate.AddDays(-12) };
        var p6 = new { Id = DeterministicGuid(2, 6), AuthorUserId = buyerIds[0], Title = "Mi experiencia con el bálsamo labial de Copoazú", Category = "Emprendimiento", Content = "¡Hola! Acabo de recibir mi pedido de bálsamo labial de Copoazú elaborado por el emprendimiento de la Orinoquía. La hidratación es increíble y tiene un aroma delicioso. Es genial saber que apoya la conservación del bosque amazónico.", Status = "Published", IsPinned = false, CreatedAt = seedDate.AddDays(-10) };
        var p7 = new { Id = DeterministicGuid(2, 7), AuthorUserId = Guid.Parse("A4444444-4444-4444-4444-444444444444"), Title = "El cultivo de Sacha Inchi y la transición hacia lo orgánico", Category = "Tradición", Content = "El Sacha Inchi o maní del inca es una fuente rica de Omega 3, 6 y 9. En nuestra vereda estamos haciendo la transición de cultivos de uso ilícito a Sacha Inchi 100% orgánico. Los retos son de comercialización y abonos orgánicos.", Status = "Published", IsPinned = false, CreatedAt = seedDate.AddDays(-8) };
        var p8 = new { Id = DeterministicGuid(2, 8), AuthorUserId = Guid.Parse("A2222222-2222-2222-2222-222222222222"), Title = "Registro del primer espécimen de Vainilla de la Orinoquía", Category = "Investigación", Content = "Estamos emocionados de reportar el registro científico y validación taxonómica de Vanilla planifolia en la cuenca del Meta. Este espécimen tiene características genéticas de alta resistencia a hongos comunes.", Status = "Published", IsPinned = false, CreatedAt = seedDate.AddDays(-6) };
        var p9 = new { Id = DeterministicGuid(2, 9), AuthorUserId = buyerIds[1], Title = "Taller comunitario de tintes naturales en Caldas", Category = "Educación", Content = "¿Alguien asistirá al taller de tintes naturales de este fin de semana? Quería saber qué materiales debemos llevar o si todo está incluído en la inscripción de biocomercio.", Status = "Published", IsPinned = false, CreatedAt = seedDate.AddDays(-5) };
        var p10 = new { Id = DeterministicGuid(2, 10), AuthorUserId = Guid.Parse("A3333333-3333-3333-3333-333333333333"), Title = "Canastos de Guacamayas: Arte milenario en fibra de fique", Category = "Tradición", Content = "Los canastos en rollo de Guacamayas (Boyacá) son reconocidos a nivel mundial. Cada diseño cuenta una historia diferente inspirada en el sol, la tierra y el agua. Apoyemos a los artesanos locales comprando a precios justos.", Status = "Published", IsPinned = false, CreatedAt = seedDate.AddDays(-4) };
        var p11 = new { Id = DeterministicGuid(2, 11), AuthorUserId = Guid.Parse("A1111111-1111-1111-1111-111111111111"), Title = "Actualización de las Políticas de la Comunidad y Respeto Mutuo", Category = "General", Content = "Bienvenidos al foro de BioPlatform. Queremos recordarles que este espacio es para el intercambio de conocimientos tradicionales y científicos de forma constructiva. No se tolera el lenguaje ofensivo ni la biopiratería.", Status = "Published", IsPinned = true, CreatedAt = seedDate.AddDays(-25) };
        var p12 = new { Id = DeterministicGuid(2, 12), AuthorUserId = Guid.Parse("A4444444-4444-4444-4444-444444444444"), Title = "Ideas para empaques biodegradables en productos agrícolas", Category = "Conservación", Content = "Estamos buscando alternativas al plástico para vender nuestras semillas de amaranto andino. ¿Alguien ha utilizado hojas de plátano tratadas o papel de fique? ¿Qué tal la conservación de la humedad?", Status = "Draft", IsPinned = false, CreatedAt = seedDate.AddDays(-2) };

        // 3. Community Comments
        var c1 = new { Id = DeterministicGuid(3, 1), PostId = p1.Id, AuthorUserId = Guid.Parse("A3333333-3333-3333-3333-333333333333"), Content = "¡Hola! Yo utilizo la harina de coca para hacer galletas energéticas con miel de abejas angelitas. Quedan deliciosas y son muy nutritivas.", IsDeleted = false, CreatedAt = p1.CreatedAt.AddHours(2) };
        var c2 = new { Id = DeterministicGuid(3, 2), PostId = p1.Id, AuthorUserId = Guid.Parse("A2222222-2222-2222-2222-222222222222"), Content = "Desde el punto de vista científico, la hoja de coca tiene un contenido altísimo de calcio y proteínas. Es un superalimento subutilizado por estigmas sociales.", IsDeleted = false, CreatedAt = p1.CreatedAt.AddHours(5) };
        var c3 = new { Id = DeterministicGuid(3, 3), PostId = p1.Id, AuthorUserId = buyerIds[2], Content = "Comentario ofensivo eliminado por moderación.", IsDeleted = true, CreatedAt = p1.CreatedAt.AddHours(12) };

        var c4 = new { Id = DeterministicGuid(3, 4), PostId = p2.Id, AuthorUserId = Guid.Parse("A4444444-4444-4444-4444-444444444444"), Content = "Excelente investigación. En nuestra comunidad observamos que las avispas silvestres también visitan mucho la flor del cacao por las mañanas.", IsDeleted = false, CreatedAt = p2.CreatedAt.AddHours(3) };
        var c5 = new { Id = DeterministicGuid(3, 5), PostId = p2.Id, AuthorUserId = Guid.Parse("A6666666-6666-6666-6666-666666666666"), Content = "¿Este estudio cuenta con la autorización de la autoridad ambiental pertinente para la recolecta de especímenes de insectos?", IsDeleted = false, CreatedAt = p2.CreatedAt.AddDays(1) };
        var c6 = new { Id = DeterministicGuid(3, 6), PostId = p2.Id, AuthorUserId = Guid.Parse("A2222222-2222-2222-2222-222222222222"), Content = "Sí, estimada Autoridad. Todos nuestros muestreos están amparados bajo el Permiso Marco de Recolección con fines de investigación científica de la Universidad.", IsDeleted = false, CreatedAt = p2.CreatedAt.AddDays(1).AddHours(2) };

        var c7 = new { Id = DeterministicGuid(3, 7), PostId = p3.Id, AuthorUserId = buyerIds[3], Content = "¿Dónde podemos comprar esta miel de angelita? He oído que es excelente para limpiar los ojos cansados.", IsDeleted = false, CreatedAt = p3.CreatedAt.AddHours(4) };
        var c8 = new { Id = DeterministicGuid(3, 8), PostId = p3.Id, AuthorUserId = Guid.Parse("A3333333-3333-3333-3333-333333333333"), Content = "Hola. Puedes ver nuestra tienda en el Marketplace de BioPlatform, ahí tenemos stock disponible y certificado. Saludos.", IsDeleted = false, CreatedAt = p3.CreatedAt.AddHours(6) };

        var c9 = new { Id = DeterministicGuid(3, 9), PostId = p4.Id, AuthorUserId = Guid.Parse("A3333333-3333-3333-3333-333333333333"), Content = "Hola. Nosotros producimos aceite de Cacay puro extraído en frío. Te envié un mensaje directo para compartirte la ficha técnica y precios.", IsDeleted = false, CreatedAt = p4.CreatedAt.AddHours(1) };

        var c10 = new { Id = DeterministicGuid(3, 10), PostId = p7.Id, AuthorUserId = Guid.Parse("A2222222-2222-2222-2222-222222222222"), Content = "Felicitaciones por la transición. Estaremos visitando la zona el próximo mes, nos gustaría tomar muestras foliares para analizar la salud del cultivo.", IsDeleted = false, CreatedAt = p7.CreatedAt.AddDays(1) };
        var c11 = new { Id = DeterministicGuid(3, 11), PostId = p7.Id, AuthorUserId = Guid.Parse("A4444444-4444-4444-4444-444444444444"), Content = "Serán muy bienvenidos. La comunidad está abierta a la validación científica de nuestros esfuerzos de sustitución.", IsDeleted = false, CreatedAt = p7.CreatedAt.AddDays(1).AddHours(3) };

        var c12 = new { Id = DeterministicGuid(3, 12), PostId = p10.Id, AuthorUserId = Guid.Parse("A5555555-5555-5555-5555-555555555555"), Content = "Son verdaderas obras de arte. Compré uno el mes pasado y el nivel de detalle en el tejido de fique es espectacular.", IsDeleted = false, CreatedAt = p10.CreatedAt.AddHours(8) };

        // 4. Community Reactions & Verification counts
        var reactions = new List<object>();
        int reactCounter = 1;

        var postLikes = new Dictionary<Guid, int>();
        var postDislikes = new Dictionary<Guid, int>();
        var commentLikes = new Dictionary<Guid, int>();
        var commentDislikes = new Dictionary<Guid, int>();

        var allPostIds = new[] { p1.Id, p2.Id, p3.Id, p4.Id, p5.Id, p6.Id, p7.Id, p8.Id, p9.Id, p10.Id, p11.Id, p12.Id };
        foreach (var pid in allPostIds)
        {
            postLikes[pid] = 0;
            postDislikes[pid] = 0;
        }

        var allCommentIds = new[] { c1.Id, c2.Id, c3.Id, c4.Id, c5.Id, c6.Id, c7.Id, c8.Id, c9.Id, c10.Id, c11.Id, c12.Id };
        foreach (var cid in allCommentIds)
        {
            commentLikes[cid] = 0;
            commentDislikes[cid] = 0;
        }

        Action<Guid, Guid, string, string> addReaction = (uId, targetId, targetType, rType) =>
        {
            reactions.Add(new
            {
                Id = DeterministicGuid(4, reactCounter++),
                UserId = uId,
                TargetType = targetType,
                TargetId = targetId,
                ReactionType = rType,
                CreatedAt = seedDate.AddDays(-3)
            });

            if (targetType == "Post")
            {
                if (rType == "Like") postLikes[targetId]++;
                else postDislikes[targetId]++;
            }
            else if (targetType == "Comment")
            {
                if (rType == "Like") commentLikes[targetId]++;
                else commentDislikes[targetId]++;
            }
        };

        // Likes on Post 1
        addReaction(Guid.Parse("A5555555-5555-5555-5555-555555555555"), p1.Id, "Post", "Like");
        addReaction(Guid.Parse("A2222222-2222-2222-2222-222222222222"), p1.Id, "Post", "Like");
        addReaction(Guid.Parse("A3333333-3333-3333-3333-333333333333"), p1.Id, "Post", "Like");
        addReaction(buyerIds[0], p1.Id, "Post", "Like");
        addReaction(buyerIds[1], p1.Id, "Post", "Like");

        // Likes/Dislikes on Post 2
        addReaction(Guid.Parse("A4444444-4444-4444-4444-444444444444"), p2.Id, "Post", "Like");
        addReaction(Guid.Parse("A3333333-3333-3333-3333-333333333333"), p2.Id, "Post", "Like");
        addReaction(buyerIds[5], p2.Id, "Post", "Like");
        addReaction(Guid.Parse("A6666666-6666-6666-6666-666666666666"), p2.Id, "Post", "Dislike");

        // Likes on Post 3
        addReaction(Guid.Parse("A5555555-5555-5555-5555-555555555555"), p3.Id, "Post", "Like");
        addReaction(buyerIds[10], p3.Id, "Post", "Like");
        addReaction(buyerIds[11], p3.Id, "Post", "Like");

        // Likes on Post 4
        addReaction(Guid.Parse("A3333333-3333-3333-3333-333333333333"), p4.Id, "Post", "Like");
        addReaction(buyerIds[12], p4.Id, "Post", "Like");

        // Likes on Post 7
        addReaction(Guid.Parse("A2222222-2222-2222-2222-222222222222"), p7.Id, "Post", "Like");
        addReaction(buyerIds[4], p7.Id, "Post", "Like");

        // Likes on Post 8
        addReaction(Guid.Parse("A6666666-6666-6666-6666-666666666666"), p8.Id, "Post", "Like");
        addReaction(Guid.Parse("A4444444-4444-4444-4444-444444444444"), p8.Id, "Post", "Like");

        // Likes on Comments
        addReaction(Guid.Parse("A4444444-4444-4444-4444-444444444444"), c1.Id, "Comment", "Like");
        addReaction(Guid.Parse("A5555555-5555-5555-5555-555555555555"), c1.Id, "Comment", "Like");
        addReaction(Guid.Parse("A4444444-4444-4444-4444-444444444444"), c2.Id, "Comment", "Like");
        addReaction(buyerIds[2], c2.Id, "Comment", "Like");
        addReaction(Guid.Parse("A2222222-2222-2222-2222-222222222222"), c4.Id, "Comment", "Like");
        addReaction(Guid.Parse("A2222222-2222-2222-2222-222222222222"), c6.Id, "Comment", "Like");
        addReaction(buyerIds[3], c8.Id, "Comment", "Like");

        // Build Post/Comment seeding lists with exact counts
        var seededPosts = new List<object>
        {
            new { p1.Id, p1.AuthorUserId, p1.Title, p1.Content, p1.Category, p1.Status, p1.IsPinned, LikesCount = postLikes[p1.Id], DislikesCount = postDislikes[p1.Id], p1.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p2.Id, p2.AuthorUserId, p2.Title, p2.Content, p2.Category, p2.Status, p2.IsPinned, LikesCount = postLikes[p2.Id], DislikesCount = postDislikes[p2.Id], p2.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p3.Id, p3.AuthorUserId, p3.Title, p3.Content, p3.Category, p3.Status, p3.IsPinned, LikesCount = postLikes[p3.Id], DislikesCount = postDislikes[p3.Id], p3.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p4.Id, p4.AuthorUserId, p4.Title, p4.Content, p4.Category, p4.Status, p4.IsPinned, LikesCount = postLikes[p4.Id], DislikesCount = postDislikes[p4.Id], p4.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p5.Id, p5.AuthorUserId, p5.Title, p5.Content, p5.Category, p5.Status, p5.IsPinned, LikesCount = postLikes[p5.Id], DislikesCount = postDislikes[p5.Id], p5.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p6.Id, p6.AuthorUserId, p6.Title, p6.Content, p6.Category, p6.Status, p6.IsPinned, LikesCount = postLikes[p6.Id], DislikesCount = postDislikes[p6.Id], p6.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p7.Id, p7.AuthorUserId, p7.Title, p7.Content, p7.Category, p7.Status, p7.IsPinned, LikesCount = postLikes[p7.Id], DislikesCount = postDislikes[p7.Id], p7.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p8.Id, p8.AuthorUserId, p8.Title, p8.Content, p8.Category, p8.Status, p8.IsPinned, LikesCount = postLikes[p8.Id], DislikesCount = postDislikes[p8.Id], p8.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p9.Id, p9.AuthorUserId, p9.Title, p9.Content, p9.Category, p9.Status, p9.IsPinned, LikesCount = postLikes[p9.Id], DislikesCount = postDislikes[p9.Id], p9.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p10.Id, p10.AuthorUserId, p10.Title, p10.Content, p10.Category, p10.Status, p10.IsPinned, LikesCount = postLikes[p10.Id], DislikesCount = postDislikes[p10.Id], p10.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p11.Id, p11.AuthorUserId, p11.Title, p11.Content, p11.Category, p11.Status, p11.IsPinned, LikesCount = postLikes[p11.Id], DislikesCount = postDislikes[p11.Id], p11.CreatedAt, UpdatedAt = (DateTime?)null },
            new { p12.Id, p12.AuthorUserId, p12.Title, p12.Content, p12.Category, p12.Status, p12.IsPinned, LikesCount = postLikes[p12.Id], DislikesCount = postDislikes[p12.Id], p12.CreatedAt, UpdatedAt = (DateTime?)null }
        };

        var seededComments = new List<object>
        {
            new { c1.Id, c1.PostId, c1.AuthorUserId, c1.Content, c1.IsDeleted, LikesCount = commentLikes[c1.Id], DislikesCount = commentDislikes[c1.Id], c1.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c2.Id, c2.PostId, c2.AuthorUserId, c2.Content, c2.IsDeleted, LikesCount = commentLikes[c2.Id], DislikesCount = commentDislikes[c2.Id], c2.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c3.Id, c3.PostId, c3.AuthorUserId, c3.Content, c3.IsDeleted, LikesCount = commentLikes[c3.Id], DislikesCount = commentDislikes[c3.Id], c3.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c4.Id, c4.PostId, c4.AuthorUserId, c4.Content, c4.IsDeleted, LikesCount = commentLikes[c4.Id], DislikesCount = commentDislikes[c4.Id], c4.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c5.Id, c5.PostId, c5.AuthorUserId, c5.Content, c5.IsDeleted, LikesCount = commentLikes[c5.Id], DislikesCount = commentDislikes[c5.Id], c5.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c6.Id, c6.PostId, c6.AuthorUserId, c6.Content, c6.IsDeleted, LikesCount = commentLikes[c6.Id], DislikesCount = commentDislikes[c6.Id], c6.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c7.Id, c7.PostId, c7.AuthorUserId, c7.Content, c7.IsDeleted, LikesCount = commentLikes[c7.Id], DislikesCount = commentDislikes[c7.Id], c7.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c8.Id, c8.PostId, c8.AuthorUserId, c8.Content, c8.IsDeleted, LikesCount = commentLikes[c8.Id], DislikesCount = commentDislikes[c8.Id], c8.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c9.Id, c9.PostId, c9.AuthorUserId, c9.Content, c9.IsDeleted, LikesCount = commentLikes[c9.Id], DislikesCount = commentDislikes[c9.Id], c9.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c10.Id, c10.PostId, c10.AuthorUserId, c10.Content, c10.IsDeleted, LikesCount = commentLikes[c10.Id], DislikesCount = commentDislikes[c10.Id], c10.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c11.Id, c11.PostId, c11.AuthorUserId, c11.Content, c11.IsDeleted, LikesCount = commentLikes[c11.Id], DislikesCount = commentDislikes[c11.Id], c11.CreatedAt, UpdatedAt = (DateTime?)null },
            new { c12.Id, c12.PostId, c12.AuthorUserId, c12.Content, c12.IsDeleted, LikesCount = commentLikes[c12.Id], DislikesCount = commentDislikes[c12.Id], c12.CreatedAt, UpdatedAt = (DateTime?)null }
        };

        modelBuilder.Entity<CommunityPost>().HasData(seededPosts);
        modelBuilder.Entity<CommunityPostComment>().HasData(seededComments);
        modelBuilder.Entity<CommunityReaction>().HasData(reactions);

        // 5. Chats & Groups (DirectThreads, Participants, Messages, MessageReads)
        var threads = new List<object>();
        var participants = new List<object>();
        var messages = new List<object>();
        var messageReads = new List<object>();

        int threadCounter = 1;
        int msgCounter = 1;

        Action<Guid, string, string, List<Guid>> addThread = (tId, title, tType, userList) =>
        {
            threads.Add(new
            {
                Id = tId,
                Title = tType == "Group" ? title : null,
                ThreadType = tType,
                CreatedAt = seedDate.AddDays(-15),
                UpdatedAt = (DateTime?)seedDate.AddDays(-1)
            });

            foreach (var uId in userList)
            {
                participants.Add(new
                {
                    ThreadId = tId,
                    UserId = uId,
                    JoinedAt = seedDate.AddDays(-15),
                    LeftAt = (DateTime?)null,
                    IsMuted = false
                });
            }
        };

        Action<Guid, Guid, string, DateTime, List<Guid>> addMessage = (threadId, senderId, content, sentAt, recipients) =>
        {
            var msgId = DeterministicGuid(6, msgCounter++);
            messages.Add(new
            {
                Id = msgId,
                ThreadId = threadId,
                SenderUserId = senderId,
                Content = content,
                IsDeleted = false,
                CreatedAt = sentAt
            });

            foreach (var rId in recipients)
            {
                if (rId == senderId) continue;
                messageReads.Add(new
                {
                    MessageId = msgId,
                    UserId = rId,
                    ReadAt = sentAt.AddMinutes(5)
                });
            }
        };

        // Thread 1: Buyer A5555555 & Entrepreneur A3333333 (Direct)
        var t1Id = DeterministicGuid(5, threadCounter++);
        var t1Users = new List<Guid> { Guid.Parse("A5555555-5555-5555-5555-555555555555"), Guid.Parse("A3333333-3333-3333-3333-333333333333") };
        addThread(t1Id, "", "Direct", t1Users);

        var t1Date = seedDate.AddDays(-10);
        addMessage(t1Id, Guid.Parse("A5555555-5555-5555-5555-555555555555"), "Hola. Estoy interesado en comprar la Miel de Abejas Angelitas. ¿Tienen disponibilidad?", t1Date.AddHours(9), t1Users);
        addMessage(t1Id, Guid.Parse("A3333333-3333-3333-3333-333333333333"), "Hola, claro que sí. En este momento tenemos stock fresco cosechado la semana pasada. ¿De cuántos gramos necesitas?", t1Date.AddHours(9).AddMinutes(15), t1Users);
        addMessage(t1Id, Guid.Parse("A5555555-5555-5555-5555-555555555555"), "Quisiera 3 frascos de 250g. ¿Cuánto tiempo tarda el envío a Manizales?", t1Date.AddHours(10), t1Users);
        addMessage(t1Id, Guid.Parse("A3333333-3333-3333-3333-333333333333"), "Tarda entre 1 y 2 días hábiles. Si haces la compra por la plataforma hoy mismo, despachamos mañana a primera hora.", t1Date.AddHours(10).AddMinutes(10), t1Users);
        addMessage(t1Id, Guid.Parse("A5555555-5555-5555-5555-555555555555"), "Excelente, acabo de realizar el pago mediante la app. ¡Quedo atento!", t1Date.AddHours(11), t1Users);
        addMessage(t1Id, Guid.Parse("A3333333-3333-3333-3333-333333333333"), "Confirmado el pago. Muchas gracias por apoyar nuestro apiario sostenible. Te llegará la notificación con la guía de transporte.", t1Date.AddHours(11).AddMinutes(5), t1Users);

        // Thread 2: Community A4444444 & Researcher A2222222 (Direct)
        var t2Id = DeterministicGuid(5, threadCounter++);
        var t2Users = new List<Guid> { Guid.Parse("A4444444-4444-4444-4444-444444444444"), Guid.Parse("A2222222-2222-2222-2222-222222222222") };
        addThread(t2Id, "", "Direct", t2Users);

        var t2Date = seedDate.AddDays(-12);
        addMessage(t2Id, Guid.Parse("A4444444-4444-4444-4444-444444444444"), "Un saludo doctor. Encontré una variedad de orquídea silvestre en la reserva comunitaria y le tomé fotos detalladas. ¿Me podría ayudar a confirmar su taxonomía?", t2Date.AddHours(14), t2Users);
        addMessage(t2Id, Guid.Parse("A2222222-2222-2222-2222-222222222222"), "Hola. Qué buena noticia. Claro que sí, por favor envíame las fotos por este medio o publícalas en el foro de conservación para que otros botánicos puedan verlas también.", t2Date.AddHours(14).AddMinutes(30), t2Users);
        addMessage(t2Id, Guid.Parse("A4444444-4444-4444-4444-444444444444"), "Listo, acabo de subirlas en un post en la categoría de Ciencia. Mencioné que es del género Epidendrum.", t2Date.AddHours(15), t2Users);
        addMessage(t2Id, Guid.Parse("A2222222-2222-2222-2222-222222222222"), "Perfecto. Ya reviso el post y hago la validación taxonómica formal. Gracias por el reporte.", t2Date.AddHours(15).AddMinutes(12), t2Users);

        // Thread 3: Admin A1111111 & Researcher A2222222 (Direct)
        var t3Id = DeterministicGuid(5, threadCounter++);
        var t3Users = new List<Guid> { Guid.Parse("A1111111-1111-1111-1111-111111111111"), Guid.Parse("A2222222-2222-2222-2222-222222222222") };
        addThread(t3Id, "", "Direct", t3Users);

        var t3Date = seedDate.AddDays(-14);
        addMessage(t3Id, Guid.Parse("A2222222-2222-2222-2222-222222222222"), "Hola admin. Tengo un problema al subir un set de imágenes de Vainilla de la Orinoquía. Me sale un error de tamaño de archivo.", t3Date.AddHours(8), t3Users);
        addMessage(t3Id, Guid.Parse("A1111111-1111-1111-1111-111111111111"), "Hola Researcher. El límite actual por imagen es de 5MB. Si tu archivo es más grande, te sugiero comprimirlo. De todas formas, voy a revisar los logs del servidor para ver el error exacto.", t3Date.AddHours(8).AddMinutes(45), t3Users);
        addMessage(t3Id, Guid.Parse("A2222222-2222-2222-2222-222222222222"), "Entendido. Estaban en formato TIFF muy pesado. Las convertí a JPG de 3MB y subieron sin problema. ¡Gracias!", t3Date.AddHours(9).AddMinutes(10), t3Users);

        // Thread 4: Group - Saberes Ancestrales y Bioeconomía
        var t4Id = DeterministicGuid(5, threadCounter++);
        var t4Users = new List<Guid> {
            Guid.Parse("A4444444-4444-4444-4444-444444444444"), // Community
            Guid.Parse("A3333333-3333-3333-3333-333333333333"), // Entrepreneur
            Guid.Parse("A2222222-2222-2222-2222-222222222222"), // Researcher
            Guid.Parse("A5555555-5555-5555-5555-555555555555")  // Buyer
        };
        addThread(t4Id, "Saberes Ancestrales y Bioeconomía", "Group", t4Users);

        var t4Date = seedDate.AddDays(-8);
        addMessage(t4Id, Guid.Parse("A4444444-4444-4444-4444-444444444444"), "Bienvenidos a este grupo de Saberes Ancestrales. Aquí podemos coordinar las publicaciones del foro y hablar de proyectos conjuntos.", t4Date.AddHours(10), t4Users);
        addMessage(t4Id, Guid.Parse("A3333333-3333-3333-3333-333333333333"), "Hola a todos. Excelente iniciativa. Creo que podemos hacer un post conjunto sobre el cultivo orgánico de Sacha Inchi y su procesamiento artesanal.", t4Date.AddHours(10).AddMinutes(12), t4Users);
        addMessage(t4Id, Guid.Parse("A2222222-2222-2222-2222-222222222222"), "Totalmente de acuerdo. Desde la academia podemos aportar la validación de perfiles lipídicos del aceite para el post, mostrando sus beneficios científicos.", t4Date.AddHours(10).AddMinutes(25), t4Users);
        addMessage(t4Id, Guid.Parse("A5555555-5555-5555-5555-555555555555"), "¡Hola! Me uno como comprador interesado. Sería fantástico leer ese artículo para entender mejor la calidad de los productos que estamos adquiriendo.", t4Date.AddHours(11), t4Users);

        // Thread 5: Group - Conservación de Especies Nativas - Caldas
        var t5Id = DeterministicGuid(5, threadCounter++);
        var t5Users = new List<Guid> {
            Guid.Parse("A2222222-2222-2222-2222-222222222222"), // Researcher
            Guid.Parse("A6666666-6666-6666-6666-666666666666"), // Authority
            Guid.Parse("A1111111-1111-1111-1111-111111111111"), // Admin
            Guid.Parse("A5555555-5555-5555-5555-555555555555")  // Buyer
        };
        addThread(t5Id, "Conservación y Biodiversidad de Caldas", "Group", t5Users);

        var t5Date = seedDate.AddDays(-7);
        addMessage(t5Id, Guid.Parse("A2222222-2222-2222-2222-222222222222"), "Establezco este canal para revisar el plan de conservación comunitaria en Río Claro. ¿Cómo van los permisos de avistamiento?", t5Date.AddHours(14), t5Users);
        addMessage(t5Id, Guid.Parse("A6666666-6666-6666-6666-666666666666"), "Hola. Los términos de referencia de la licencia ambiental están listos. Falta anexar el mapa de zonificación comunitaria.", t5Date.AddHours(15), t5Users);
        addMessage(t5Id, Guid.Parse("A1111111-1111-1111-1111-111111111111"), "Hola. Ya habilité la carga de mapas en formato GeoJSON en el panel del proyecto. Pueden subir el mapa de zonificación allí mismo.", t5Date.AddHours(15).AddMinutes(20), t5Users);

        modelBuilder.Entity<DirectThread>().HasData(threads);
        modelBuilder.Entity<DirectThreadParticipant>().HasData(participants);
        modelBuilder.Entity<DirectMessage>().HasData(messages);
        modelBuilder.Entity<DirectMessageRead>().HasData(messageReads);
    }

    private static Guid DeterministicGuid(int prefix, int counter)
    {
        return new Guid(string.Format("C{0:D7}-0000-0000-0000-{1:D12}", prefix, counter));
    }
}
