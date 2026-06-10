using Microsoft.EntityFrameworkCore;
using Bio.Domain.Entities;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

public static partial class BioDbContextMockSeeder
{
    /// <summary>
    /// Seeds the marketplace catalog: product categories, products (with composition and gallery),
    /// product images, sustainability certifications and ABS permits.
    /// ABS permits cover both compliance (Active, one per base species) and the "requests" inbox
    /// (Pending / Rejected / Suspended) surfaced by the aggregated requests query.
    /// </summary>
    internal static void SeedMockCatalog(this ModelBuilder modelBuilder, MockSeedContext ctx)
    {
        // ── 1. Categories (broad biocommerce taxonomy) ───────────────────────
        modelBuilder.Entity<ProductCategory>().HasData(
            new { Id = 1, Name = "Alimentación Viva y Superalimentos" },
            new { Id = 2, Name = "Mieles y Derivados Apícolas" },
            new { Id = 3, Name = "Cosmética Natural y Botánica" },
            new { Id = 4, Name = "Artesanías y Saberes Tradicionales" },
            new { Id = 5, Name = "Aceites Esenciales y Extractos" },
            new { Id = 6, Name = "Servicios Ecoturísticos" },
            new { Id = 7, Name = "Semillas y Plantas Nativas" },
            new { Id = 8, Name = "Bisutería y Joyería Natural" },
            new { Id = 9, Name = "Textiles y Fibras Naturales" },
            new { Id = 10, Name = "Material Educativo y Científico" },
            new { Id = 11, Name = "Consultoría y Servicios Ambientales" },
            new { Id = 12, Name = "Bebidas e Infusiones" },
            new { Id = 13, Name = "Restauración Ecológica y Reforestación" },
            new { Id = 14, Name = "Arte y Fotografía de Naturaleza" }
        );

        // ── 2. Products + 3. Product images ──────────────────────────────────
        var products = new List<object>();
        var images = new List<object>();
        int imgCounter = 1;

        foreach (var p in ctx.Products)
        {
            products.Add(new
            {
                Id = p.Id,
                Slug = p.Slug,
                EntrepreneurId = p.SellerId,
                BaseSpeciesId = p.SpeciesId,
                CategoryId = (int?)p.CategoryId,
                Name = p.Name,
                Description = p.Description,
                BasePrice = p.BasePrice,
                SellPrice = p.SellPrice,
                Composition = p.CompositionJson,
                StockQuantity = p.Stock,
                Sku = p.Sku,
                IsActive = true,       // already approved & visible in the marketplace
                IsApproved = true,     // pre-approved seed data
                ApprovedAt = (DateTime?)ctx.SeedDate,
                ApprovedById = (Guid?)MockSeedContext.AuthorityId,
                RejectionReason = (string?)null,
                IsDeleted = false,
                DeletedAt = (DateTime?)null,
                UpdatedAt = (DateTime?)null,
                ThumbnailUrl = p.Gallery[0],
                CreatedAt = ctx.SeedDate,
            });

            for (int k = 0; k < p.Gallery.Length; k++)
            {
                images.Add(new
                {
                    Id = MockSeedContext.Det(12, imgCounter++),
                    ProductId = p.Id,
                    ImageUrl = p.Gallery[k],
                    AltText = $"{p.Name} — imagen {k + 1}",
                    DisplayOrder = k,
                    IsPrimary = k == 0,
                    CreatedAt = ctx.SeedDate,
                });
            }
        }

        modelBuilder.Entity<Product>().HasData(products);
        modelBuilder.Entity<ProductImage>().HasData(images);

        // ── 4. Certifications (on the consumable / botanical products) ────────
        var certs = new List<object>();
        int certCounter = 1;
        // Product index (1-based in Det) -> certification template.
        var certPlan = new (int ProductIndex, string Name, string Type, string Body, string Code)[]
        {
            (6,  "Biocomercio Sostenible", "Sustainability", "Instituto Humboldt", "BIO-2024-006"),
            (7,  "Miel 100% Natural",      "Quality",        "ICA",               "ICA-2024-007"),
            (11, "Producto Orgánico",      "Organic",        "Ecocert Colombia",  "ECO-2024-011"),
            (12, "Cosmética Natural",      "Quality",        "INVIMA",            "INV-2024-012"),
            (21, "Comercio Justo",         "FairTrade",      "Fairtrade Ibérica", "FT-2024-021"),
            (26, "Producto Orgánico",      "Organic",        "Ecocert Colombia",  "ECO-2024-026"),
            (28, "Cosmética Natural",      "Quality",        "INVIMA",            "INV-2024-028"),
            (2,  "Turismo Sostenible",     "Sustainability", "Mincomercio",       "TS-2024-002"),
        };
        foreach (var c in certPlan)
        {
            certs.Add(new
            {
                Id = MockSeedContext.Det(18, certCounter++),
                ProductId = MockSeedContext.Det(11, c.ProductIndex),
                Name = c.Name,
                CertificationType = c.Type,
                IssuingBody = c.Body,
                CertificateNumber = c.Code,
                IssuedAt = ctx.SeedDate.AddMonths(-6),
                ExpiresAt = (DateTime?)ctx.SeedDate.AddYears(2),
                Status = "Active",
                VerificationCode = c.Code,
                CreatedAt = ctx.SeedDate.AddMonths(-6),
            });
        }
        modelBuilder.Entity<Certification>().HasData(certs);

        // ── 5. ABS permits ───────────────────────────────────────────────────
        var permits = new List<object>();
        int permitCounter = 1;
        const string CorpoCaldas = "Corporación Autónoma Regional de Caldas (CORPOCALDAS)";
        const string MinAmbiente = "Ministerio de Ambiente y Desarrollo Sostenible";
        const string LegalFw = "Decisión Andina 391 / Decreto 1376 de 2013";

        // 5.1 Active compliance permits — one per base species, owned by its seller.
        foreach (var sp in ctx.Species)
        {
            permits.Add(new
            {
                Id = MockSeedContext.Det(17, permitCounter),
                EntrepreneurId = ctx.SellerIds[sp.SellerIndex],
                SpeciesId = sp.Id,
                ResolutionNumber = $"RES-{2024}-{permitCounter:D4}",
                EmissionDate = ctx.SeedDate.AddMonths(-8),
                ExpirationDate = ctx.SeedDate.AddYears(2),
                GrantingAuthority = CorpoCaldas,
                Status = "Active",
                LegalFramework = LegalFw,
                DocumentUrl = (string?)null,
                RequestedAt = ctx.SeedDate.AddMonths(-9),
                Justification = $"Aprovechamiento comercial sostenible de productos derivados de {sp.Scientific} ({sp.Common}).",
                ApprovedById = (Guid?)MockSeedContext.AuthorityId,
                ApprovedAt = (DateTime?)ctx.SeedDate.AddMonths(-8),
                RejectionReason = (string?)null,
            });
            permitCounter++;
        }

        // 5.2 Pending requests (appear in the "Solicitudes" inbox).
        // Species referenced by scientific name → UUIDv5 (same ids the catalog importer produces).
        var pending = new (Guid SpeciesId, int SellerIndex, string Justification)[]
        {
            (MockSeedContext.SpeciesIdFor("Alnus acuminata"), 1, "Solicitud de acceso para investigar el potencial de Alnus acuminata (aliso) en sistemas agroforestales y restauración de microcuencas."),
            (MockSeedContext.SpeciesIdFor("Adelomyia melanogenys"), 3, "Acceso con fines de ecoturismo de observación de Adelomyia melanogenys (colibrí) en senderos interpretativos de Caldas."),
            (MockSeedContext.SpeciesIdFor("Armillaria mellea"), 2, "Estudio del potencial cosmético de metabolitos de Armillaria mellea (hongo del bosque andino); se solicita acceso para fase de investigación."),
            (MockSeedContext.SpeciesIdFor("Acacia decurrens"), 4, "Solicitud para incorporar tintes naturales de Acacia decurrens en una nueva línea textil artesanal."),
        };
        foreach (var r in pending)
        {
            var requestedAt = ctx.SeedDate.AddDays(-(5 + permitCounter));
            permits.Add(new
            {
                Id = MockSeedContext.Det(17, permitCounter),
                EntrepreneurId = ctx.SellerIds[r.SellerIndex],
                SpeciesId = r.SpeciesId,
                ResolutionNumber = string.Empty,
                EmissionDate = requestedAt,
                ExpirationDate = requestedAt,
                GrantingAuthority = string.Empty,
                Status = "Pending",
                LegalFramework = (string?)null,
                DocumentUrl = (string?)null,
                RequestedAt = requestedAt,
                Justification = (string?)r.Justification,
                ApprovedById = (Guid?)null,
                ApprovedAt = (DateTime?)null,
                RejectionReason = (string?)null,
            });
            permitCounter++;
        }

        // 5.3 Rejected requests.
        var rejected = new (Guid SpeciesId, int SellerIndex, string Justification, string Reason)[]
        {
            (MockSeedContext.SpeciesIdFor("Alouatta seniculus"), 5, "Solicitud de aprovechamiento comercial de Alouatta seniculus (mono aullador).", "La especie corresponde a fauna silvestre protegida; no se autoriza su aprovechamiento comercial conforme a la normativa vigente."),
            (MockSeedContext.SpeciesIdFor("Acaena elongata"), 0, "Solicitud de acceso a recurso genético de Acaena elongata para línea de extractos.", "Documentación incompleta: falta el soporte de procedencia legal del material biológico. Se invita a subsanar y radicar nuevamente."),
        };
        foreach (var r in rejected)
        {
            var requestedAt = ctx.SeedDate.AddDays(-(20 + permitCounter));
            permits.Add(new
            {
                Id = MockSeedContext.Det(17, permitCounter),
                EntrepreneurId = ctx.SellerIds[r.SellerIndex],
                SpeciesId = r.SpeciesId,
                ResolutionNumber = string.Empty,
                EmissionDate = requestedAt,
                ExpirationDate = requestedAt,
                GrantingAuthority = string.Empty,
                Status = "Rejected",
                LegalFramework = (string?)null,
                DocumentUrl = (string?)null,
                RequestedAt = requestedAt,
                Justification = (string?)r.Justification,
                ApprovedById = (Guid?)MockSeedContext.AuthorityId,
                ApprovedAt = (DateTime?)requestedAt.AddDays(7),
                RejectionReason = (string?)r.Reason,
            });
            permitCounter++;
        }

        // 5.4 Suspended permits (issued, then put under compliance review).
        var suspended = new (int SpeciesIndex, string Note)[]
        {
            (1, "Suspendido temporalmente mientras se verifica el cumplimiento de las cuotas de aprovechamiento autorizadas."),
            (5, "Suspendido por revisión de la trazabilidad del material; pendiente de informe técnico de la autoridad."),
        };
        foreach (var s in suspended)
        {
            var sp = ctx.Species[s.SpeciesIndex];
            var requestedAt = ctx.SeedDate.AddMonths(-10);
            permits.Add(new
            {
                Id = MockSeedContext.Det(17, permitCounter),
                EntrepreneurId = ctx.SellerIds[sp.SellerIndex],
                SpeciesId = sp.Id,
                ResolutionNumber = $"RES-{2023}-{permitCounter:D4}",
                EmissionDate = ctx.SeedDate.AddMonths(-9),
                ExpirationDate = ctx.SeedDate.AddYears(1),
                GrantingAuthority = MinAmbiente,
                Status = "Suspended",
                LegalFramework = LegalFw,
                DocumentUrl = (string?)null,
                RequestedAt = requestedAt,
                Justification = (string?)$"Aprovechamiento de {sp.Scientific} ({sp.Common}). {s.Note}",
                ApprovedById = (Guid?)MockSeedContext.AuthorityId,
                ApprovedAt = (DateTime?)ctx.SeedDate.AddMonths(-9),
                RejectionReason = (string?)null,
            });
            permitCounter++;
        }

        modelBuilder.Entity<AbsPermit>().HasData(permits);
    }
}
