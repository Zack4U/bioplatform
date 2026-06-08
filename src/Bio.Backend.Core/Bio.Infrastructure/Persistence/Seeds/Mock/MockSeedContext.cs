using System.Security.Cryptography;

namespace Bio.Backend.Core.Bio.Infrastructure.Persistence;

/// <summary>
/// Shared, fully deterministic data used by every mock seeder partial.
/// No <see cref="Guid.NewGuid"/> and no <see cref="DateTime.Now"/> are allowed anywhere in the
/// mock seeders: every id and timestamp is derived from fixed inputs so that EF Core migrations
/// stay stable across rebuilds (HasData snapshots must not drift).
/// </summary>
internal sealed class MockSeedContext
{
    // ── Anchor date (UTC) ───────────────────────────────────────────────────
    public DateTime SeedDate { get; } = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    // ── Password material (matches the canonical "DevPassword123!") ──────────
    public string Hash { get; }
    public string Salt { get; }

    // ── Roles (mirror BioDbContextSeeder) ────────────────────────────────────
    public static readonly Guid AdminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid ResearcherRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid EntrepreneurRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid CommunityRoleId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public static readonly Guid BuyerRoleId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    public static readonly Guid AuthorityRoleId = Guid.Parse("66666666-6666-6666-6666-666666666666");

    // ── Base users (one per role, seeded in BioDbContextSeeder) ──────────────
    public static readonly Guid AdminId = Guid.Parse("A1111111-1111-1111-1111-111111111111");
    public static readonly Guid ResearcherId = Guid.Parse("A2222222-2222-2222-2222-222222222222");
    public static readonly Guid EntrepreneurId = Guid.Parse("A3333333-3333-3333-3333-333333333333");
    public static readonly Guid CommunityBaseId = Guid.Parse("A4444444-4444-4444-4444-444444444444");
    public static readonly Guid BuyerBaseId = Guid.Parse("A5555555-5555-5555-5555-555555555555");
    public static readonly Guid AuthorityId = Guid.Parse("A6666666-6666-6666-6666-666666666666");

    // ── Generated populations ────────────────────────────────────────────────
    public List<Guid> BuyerIds { get; } = new();                       // 20 buyers (prefix 7)
    public Dictionary<Guid, Guid> BuyerDefaultAddress { get; } = new(); // buyerId -> default addressId
    public List<Guid> SellerIds { get; } = new();                      // 6 sellers ([0] = base entrepreneur)
    public List<Guid> CommunityIds { get; } = new();                   // 5 community users ([0] = base community)

    public List<SeedSpecies> Species { get; } = new();                 // 6 base species (real Postgres UUIDs)
    public List<SeedProduct> Products { get; } = new();                // 30 products (5 per seller/species)

    // =========================================================================
    // DETERMINISTIC ID GENERATION
    //   Prefix map (keep unique to avoid GUID collisions):
    //   1 connections · 2 posts · 3 comments · 4 reactions · 5 threads · 6 messages
    //   7 buyers · 8 sellers · 9 community · 10 addresses · 11 products
    //   12 product-images · 13 orders · 14 order-items · 15 reviews
    //   16 favorites · 17 abs-permits · 18 certifications
    // =========================================================================
    public static Guid Det(int prefix, int counter)
        => new Guid(string.Format("C{0:D7}-0000-0000-0000-{1:D12}", prefix, counter));

    // =========================================================================
    // VERIFIED IMAGE POOL (all return HTTP 200 — checked at seed-authoring time)
    // =========================================================================

    // Wikimedia Commons — real species photos (from the AI species catalog pipeline)
    public const string ImgGrasshopper = "https://upload.wikimedia.org/wikipedia/commons/a/aa/Abracris_flavolineata_442087729.jpg";
    public const string ImgAcacia = "https://upload.wikimedia.org/wikipedia/commons/0/05/Acacia-decurrens-catalina.jpg";
    public const string ImgAcaena = "https://upload.wikimedia.org/wikipedia/commons/9/98/Acaena_elongata_1.jpg";
    public const string ImgHawk = "https://upload.wikimedia.org/wikipedia/commons/c/c9/Accipiter_striatus%2C_Canet_Road%2C_San_Luis_Obispo_1.jpg";
    public const string ImgButterfly = "https://upload.wikimedia.org/wikipedia/commons/e/e3/Pale_sicklewing_%28Eantis_pallida%29.jpg";
    public const string ImgCorozo = "https://upload.wikimedia.org/wikipedia/commons/a/a2/Acrocomia_aculeata_MHNT.BOT.2017.10.1.jpg";
    public const string ImgAlnus = "https://upload.wikimedia.org/wikipedia/commons/7/75/Alnus_acuminata.jpg";
    public const string ImgMonkey = "https://upload.wikimedia.org/wikipedia/commons/e/e1/Alouatta_seniculus_5perspective.jpg";
    public const string ImgParrot = "https://upload.wikimedia.org/wikipedia/commons/1/18/Amazona_ochrocephala_-_Vogelburg_Weilrod_01.jpg";
    public const string ImgHummingbird = "https://upload.wikimedia.org/wikipedia/commons/7/77/Speckled_hummingbird_%28Adelomyia_melanogenys_melanogenys%29_Cundinamarca.jpg";

    // Unsplash — themed product / lifestyle photos
    public const string UHoney1 = "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=900";
    public const string UHoney2 = "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=900";
    public const string UHerbs = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=900";
    public const string UCream = "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900";
    public const string USoap = "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=900";
    public const string USkincare = "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=900";
    public const string UOil = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900";
    public const string UMarket = "https://images.unsplash.com/photo-1509223197845-458d87318791?w=900";
    public const string UForest1 = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900";
    public const string UForest2 = "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=900";
    public const string UTrees = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900";
    public const string UForestSun = "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=900";
    public const string UMountain = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900";
    public const string UFlowers1 = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=900";
    public const string UFlowers2 = "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=900";
    public const string UParamo = "https://images.unsplash.com/photo-1457530378978-8bac673b8062?w=900";

    private MockSeedContext()
    {
        // Deterministic PBKDF2 hash of "DevPassword123!" (same scheme as base seeder).
        byte[] saltBytes = new byte[16];
        for (int i = 0; i < 16; i++) saltBytes[i] = (byte)(i + 1);
        Salt = Convert.ToBase64String(saltBytes);
        Hash = Convert.ToBase64String(
            Rfc2898DeriveBytes.Pbkdf2("DevPassword123!", saltBytes, 100000, HashAlgorithmName.SHA256, 32));
    }

    /// <summary>Builds the full deterministic dataset shared by all mock seeders.</summary>
    public static MockSeedContext Build()
    {
        var ctx = new MockSeedContext();

        // 20 buyers + their default address ids.
        for (int i = 1; i <= 20; i++)
        {
            var buyerId = Det(7, i);
            ctx.BuyerIds.Add(buyerId);
            ctx.BuyerDefaultAddress[buyerId] = Det(10, i);
        }

        // 6 sellers: [0] is the canonical base entrepreneur, [1..5] are new.
        ctx.SellerIds.Add(EntrepreneurId);
        for (int i = 1; i <= 5; i++) ctx.SellerIds.Add(Det(8, i));

        // 5 community users: [0] is the canonical base community user, [1..4] are new.
        ctx.CommunityIds.Add(CommunityBaseId);
        for (int i = 1; i <= 4; i++) ctx.CommunityIds.Add(Det(9, i));

        BuildSpecies(ctx);
        BuildProducts(ctx);
        return ctx;
    }

    // ── 6 base species (real PostgreSQL species.id values) ───────────────────
    private static void BuildSpecies(MockSeedContext ctx)
    {
        ctx.Species.Add(new SeedSpecies(Guid.Parse("1c0dd32a-a9df-452b-8ede-d63614393289"), "Abracris flavolineata", "Saltamontes de rayas amarillas", ImgGrasshopper, 0));
        ctx.Species.Add(new SeedSpecies(Guid.Parse("ae5264fb-7571-4e06-a03d-e817c25637ee"), "Acacia decurrens", "Acacia negra", ImgAcacia, 1));
        ctx.Species.Add(new SeedSpecies(Guid.Parse("9d148360-9799-443a-b0b5-db5b9814514e"), "Acaena elongata", "Cadillo de páramo", ImgAcaena, 2));
        ctx.Species.Add(new SeedSpecies(Guid.Parse("83a36487-5f3f-4cc7-bec2-6414dcc92501"), "Accipiter striatus", "Gavilán acollarado", ImgHawk, 3));
        ctx.Species.Add(new SeedSpecies(Guid.Parse("601768f6-fe6e-4117-ad71-a595b5f8f08c"), "Achlyodes pallida", "Saltarina pálida", ImgButterfly, 4));
        ctx.Species.Add(new SeedSpecies(Guid.Parse("5ae1db94-f349-4a61-906d-ad2e0a3ee7e0"), "Acrocomia aculeata", "Corozo", ImgCorozo, 5));
    }

    // ── 30 products (5 per seller / species) ─────────────────────────────────
    private static void BuildProducts(MockSeedContext ctx)
    {
        int n = 1;
        void P(int speciesIdx, int categoryId, string name, string slug, decimal price,
               int stock, string sku, string description, string composition, string[] gallery)
        {
            var sp = ctx.Species[speciesIdx];
            ctx.Products.Add(new SeedProduct(
                Id: Det(11, n++),
                SellerId: ctx.SellerIds[sp.SellerIndex],
                SpeciesId: sp.Id,
                CategoryId: categoryId,
                Name: name,
                Slug: slug,
                Description: description,
                SellPrice: price,
                BasePrice: Math.Round(price * 0.78m, 0),
                Stock: stock,
                Sku: sku,
                CompositionJson: composition,
                Gallery: gallery));
        }

        // ── Species 1 · Abracris flavolineata (seller 0 — base entrepreneur) ──
        P(0, 10, "Guía Ilustrada de Insectos de Caldas", "guia-insectos-caldas", 45000m, 50, "HC-INS-001",
          "Guía de campo ilustrada con los insectos más representativos del departamento de Caldas. Incluye 180 fotografías de alta calidad, claves de identificación y notas de hábitat elaboradas por entomólogos locales.",
          """{"origen":"Manizales, Caldas","formato":"Libro tapa blanda, 220 páginas","caracteristicas":["180 fotografías a color","Claves dicotómicas","Papel proveniente de bosques certificados"]}""",
          new[] { UHerbs, ImgGrasshopper, UForest1 });
        P(0, 6, "Tour Entomológico Guiado", "tour-entomologico-caldas", 120000m, 20, "HC-INS-002",
          "Experiencia de campo de 4 horas acompañada por un entomólogo experto. Incluye lupa de campo, guía impresa e identificación de insectos en vivo en senderos del bosque andino de Caldas.",
          """{"duracion":"4 horas","incluye":["Guía entomólogo","Lupa de campo","Refrigerio"],"dificultad":"Baja","cupoMaximo":8}""",
          new[] { UForest1, ImgGrasshopper, UForestSun });
        P(0, 10, "Kit de Colección Entomológica", "kit-coleccion-insectos", 85000m, 30, "HC-INS-003",
          "Kit profesional para colección y montaje de insectos. Contiene caja entomológica con fondo de espuma, alfileres entomológicos, pinzas de precisión y guía de montaje paso a paso.",
          """{"contenido":["Caja entomológica","50 alfileres","Pinzas de precisión","Guía de montaje"],"material":"Madera y vidrio"}""",
          new[] { UHerbs, ImgGrasshopper });
        P(0, 14, "Póster Taxonómico de Ortópteros", "poster-ortopteros-colombia", 25000m, 100, "HC-INS-004",
          "Póster científico de 60x90 cm con ilustraciones de las principales familias de ortópteros de Colombia. Impreso en papel mate de alto gramaje con tintas ecológicas.",
          """{"dimensiones":"60x90 cm","impresion":"Tintas ecológicas, papel 200g","tema":"Ortópteros de Colombia"}""",
          new[] { ImgGrasshopper, UHerbs });
        P(0, 11, "Asesoría en Control Biológico de Plagas", "servicio-control-biologico", 350000m, 10, "HC-INS-005",
          "Servicio de consultoría para manejo integrado de plagas agrícolas mediante enfoques de control biológico. Incluye diagnóstico en campo, plan de manejo y seguimiento técnico durante un ciclo de cultivo.",
          """{"modalidad":"Consultoría técnica","incluye":["Diagnóstico en campo","Plan de manejo","Seguimiento"],"dirigidoA":"Productores agrícolas"}""",
          new[] { UForest1, UHerbs });

        // ── Species 2 · Acacia decurrens (seller 1) ──────────────────────────
        P(1, 5, "Extracto de Tanino de Acacia (500g)", "tanino-acacia-500g", 65000m, 40, "AC-TAN-001",
          "Tanino natural extraído de la corteza de Acacia decurrens mediante procesos sostenibles. Ideal para el curtido vegetal de cueros y la elaboración de tintes naturales artesanales.",
          """{"presentacion":"500 g","origen":"Caldas, Colombia","usos":["Curtido vegetal","Tintes naturales"],"caracteristicas":["100% natural","Extracción sostenible"]}""",
          new[] { UHerbs, ImgAcacia });
        P(1, 2, "Miel Monofloral de Acacia (500ml)", "miel-floracion-acacia", 32000m, 80, "AC-MIE-002",
          "Miel artesanal monofloral cosechada durante la floración de la acacia. De sabor suave y color claro, producida bajo apicultura sostenible que protege a las abejas y el bosque andino.",
          """{"presentacion":"500 ml","floracion":"Acacia decurrens","caracteristicas":["Monofloral","Cruda sin pasteurizar","Apicultura sostenible"]}""",
          new[] { UHoney1, UHoney2, ImgAcacia });
        P(1, 13, "Plántulas de Acacia para Reforestación (x50)", "plantulas-acacia-reforestacion", 75000m, 25, "AC-PLT-003",
          "Lote de 50 plántulas de Acacia decurrens listas para trasplante. Especie fijadora de nitrógeno, ideal para la restauración de suelos degradados y la recuperación de microcuencas.",
          """{"cantidad":"50 plántulas","altura":"20-30 cm","beneficio":"Fijadora de nitrógeno","uso":"Restauración de suelos"}""",
          new[] { UTrees, UForest2, ImgAcacia });
        P(1, 1, "Carbón Vegetal de Acacia (5kg)", "carbon-vegetal-acacia-5kg", 18000m, 150, "AC-CAR-004",
          "Carbón vegetal de alta densidad obtenido de las podas de manejo forestal de la acacia. Combustión limpia y prolongada, producido con aprovechamiento responsable de la biomasa.",
          """{"presentacion":"5 kg","procedencia":"Podas de manejo forestal","caracteristicas":["Alta densidad","Combustión prolongada"]}""",
          new[] { UForest2, ImgAcacia });
        P(1, 13, "Servicio de Reforestación con Acacia", "servicio-reforestacion-acacia", 2500000m, 5, "AC-SRV-005",
          "Servicio integral de restauración ecológica con Acacia decurrens. Cubre preparación del terreno, siembra, fertilización orgánica inicial y seguimiento técnico durante el primer año.",
          """{"modalidad":"Servicio por hectárea","incluye":["Preparación del terreno","Siembra","Seguimiento 12 meses"],"densidad":"1100 árboles/ha"}""",
          new[] { UTrees, UForestSun, UForest2 });

        // ── Species 3 · Acaena elongata (seller 2) ───────────────────────────
        P(2, 12, "Infusión de Cadillo de Páramo (30g)", "te-cadillo-paramo-30g", 15000m, 60, "AE-INF-001",
          "Infusión herbal de hojas secas de Acaena elongata, recolectadas de forma sostenible en el páramo. De uso tradicional como antiinflamatorio y digestivo en las comunidades altoandinas.",
          """{"presentacion":"30 g","recoleccion":"Sostenible de páramo","usoTradicional":["Antiinflamatorio","Digestivo"],"preparacion":"Infusión en agua caliente"}""",
          new[] { UHerbs, ImgAcaena });
        P(2, 3, "Crema Hidratante de Páramo (50ml)", "crema-paramo-50ml", 42000m, 35, "AE-COS-002",
          "Crema cosmética artesanal formulada con extractos de plantas altoandinas, incluyendo cadillo de páramo. Brinda hidratación profunda y protección frente a climas fríos y secos.",
          """{"presentacion":"50 ml","activos":["Extracto de Acaena","Manteca vegetal"],"caracteristicas":["Sin parabenos","No testeada en animales"]}""",
          new[] { UCream, USkincare, ImgAcaena });
        P(2, 7, "Semillas Nativas para Restauración de Páramo", "semillas-restauracion-paramo", 55000m, 20, "AE-SEM-003",
          "Mezcla de semillas nativas de páramo, incluyendo Acaena elongata, seleccionadas para proyectos de restauración ecológica de ecosistemas altoandinos degradados.",
          """{"contenido":"Mezcla de semillas nativas","ecosistema":"Páramo","uso":"Restauración ecológica","cobertura":"Hasta 200 m2"}""",
          new[] { UFlowers1, UParamo, ImgAcaena });
        P(2, 10, "Guía Fotográfica de Flora de Páramos de Caldas", "guia-flora-paramos-caldas", 58000m, 45, "AE-GUI-004",
          "Guía fotográfica con 120 especies de flora de páramo, con identificación, usos tradicionales y estado de conservación. Una herramienta clave para excursionistas y restauradores.",
          """{"formato":"Libro tapa dura","especies":120,"contenido":["Identificación","Usos tradicionales","Estado de conservación"]}""",
          new[] { UParamo, UFlowers1 });
        P(2, 6, "Ecoturismo Páramo del Ruiz", "tour-paramo-ruiz", 180000m, 15, "AE-TUR-005",
          "Caminata guiada de día completo al Páramo del Ruiz. Incluye transporte desde Manizales, guía experto, almuerzo de campo y sesión de identificación botánica de la flora altoandina.",
          """{"duracion":"Día completo","incluye":["Transporte","Guía experto","Almuerzo"],"altitud":"3800-4000 msnm","dificultad":"Media"}""",
          new[] { UMountain, UParamo, UForestSun });

        // ── Species 4 · Accipiter striatus (seller 3) ────────────────────────
        P(3, 6, "Tour de Avistamiento de Rapaces", "tour-avistamiento-rapaces", 150000m, 12, "AS-TUR-001",
          "Jornada de avistamiento de aves rapaces en los Andes de Caldas, guiada por un ornitólogo. Incluye equipo óptico, checklist de rapaces y registro fotográfico de las especies observadas.",
          """{"duracion":"6 horas","incluye":["Guía ornitólogo","Equipo óptico","Checklist"],"mejorEpoca":"Migración boreal"}""",
          new[] { ImgHawk, UMountain, UForestSun });
        P(3, 14, "Póster de Rapaces de Colombia", "poster-rapaces-colombia", 28000m, 80, "AS-POS-002",
          "Póster ilustrado de 50x70 cm con las 80 especies de aves rapaces de Colombia. Ilustraciones científicas de alta calidad, ideal para aulas y centros de interpretación ambiental.",
          """{"dimensiones":"50x70 cm","especies":80,"impresion":"Papel mate 200g, tintas ecológicas"}""",
          new[] { ImgHawk, UHerbs });
        P(3, 10, "Binoculares para Avistamiento 10x42", "binoculares-avistamiento-10x42", 890000m, 8, "AS-OPT-003",
          "Binoculares profesionales 10x42 impermeables con tratamiento óptico multicapa y prismas de techo. Diseñados para el avistamiento de aves en condiciones de campo exigentes.",
          """{"aumento":"10x42","caracteristicas":["Impermeable","Tratamiento multicapa","Prismas de techo"],"garantia":"2 años"}""",
          new[] { ImgHawk, UForest1 });
        P(3, 10, "Guía de Campo: Aves Rapaces de los Andes", "guia-aves-rapaces-andes", 52000m, 40, "AS-GUI-004",
          "Guía fotográfica de bolsillo con 65 especies de rapaces andinas, con claves de identificación en vuelo y posadas. Resistente al agua, pensada para uso intensivo en campo.",
          """{"formato":"Bolsillo resistente al agua","especies":65,"contenido":["Identificación en vuelo","Siluetas","Distribución"]}""",
          new[] { ImgHawk, UMountain });
        P(3, 13, "Programa Adopta un Gavilán", "adopta-gavilan-conservacion", 200000m, 30, "AS-CON-005",
          "Apadrina la conservación de un gavilán acollarado. Incluye certificado de adopción, reportes de monitoreo del individuo y una visita de campo anual al área de conservación.",
          """{"modalidad":"Adopción simbólica anual","incluye":["Certificado","Reportes de monitoreo","Visita de campo"],"destino":"Conservación de rapaces"}""",
          new[] { ImgHawk, UForestSun });

        // ── Species 5 · Achlyodes pallida (seller 4) ─────────────────────────
        P(4, 7, "Kit Jardín de Mariposas", "jardin-mariposas-kit", 95000m, 25, "AP-JAR-001",
          "Kit completo para crear un jardín atractor de mariposas. Incluye 15 plántulas nectaríferas nativas, sustrato orgánico y una guía de cuidado para favorecer la biodiversidad en casa.",
          """{"contenido":["15 plántulas nectaríferas","Sustrato orgánico","Guía de cuidado"],"objetivo":"Atraer polinizadores"}""",
          new[] { UFlowers1, ImgButterfly, UFlowers2 });
        P(4, 10, "Guía Fotográfica: Mariposas de Caldas", "guia-mariposas-caldas", 65000m, 50, "AP-GUI-002",
          "Guía con 200 especies de mariposas y polillas de Caldas. Fotografías de alta resolución y claves de identificación para aficionados y lepidopterólogos.",
          """{"formato":"Libro tapa dura","especies":200,"contenido":["Fotografías alta resolución","Claves de identificación"]}""",
          new[] { ImgButterfly, UFlowers2 });
        P(4, 6, "Taller de Macrofotografía de Insectos", "taller-fotografia-macro-insectos", 180000m, 10, "AP-TAL-003",
          "Taller práctico de 6 horas sobre macrofotografía de insectos en campo. Incluye préstamo de lentes macro, acompañamiento técnico y edición básica de las imágenes obtenidas.",
          """{"duracion":"6 horas","incluye":["Lentes macro en préstamo","Acompañamiento técnico","Edición básica"],"nivel":"Principiante-Intermedio"}""",
          new[] { UFlowers2, ImgButterfly });
        P(4, 9, "Camiseta Ilustración Mariposas Andinas", "camiseta-ilustracion-mariposas", 48000m, 60, "AP-TEX-004",
          "Camiseta de algodón 100% orgánico con ilustración artística de 12 especies de mariposas andinas. Estampada con tintas al agua. Disponible en tallas S a XL.",
          """{"material":"Algodón 100% orgánico","tallas":["S","M","L","XL"],"estampado":"Tintas al agua","tema":"Mariposas andinas"}""",
          new[] { UMarket, ImgButterfly });
        P(4, 14, "Póster Ciclo de Vida de Lepidópteros", "poster-ciclo-vida-lepidopteros", 22000m, 90, "AP-POS-005",
          "Póster educativo ilustrado (50x70 cm) que muestra el ciclo completo de vida de mariposas y polillas, desde el huevo hasta el adulto. Ideal para aulas de ciencias.",
          """{"dimensiones":"50x70 cm","tema":"Metamorfosis de lepidópteros","uso":"Material educativo"}""",
          new[] { ImgButterfly, UFlowers1 });

        // ── Species 6 · Acrocomia aculeata (seller 5) ────────────────────────
        P(5, 5, "Aceite de Corozo Prensado en Frío (250ml)", "aceite-corozo-250ml", 38000m, 50, "AA-ACE-001",
          "Aceite vegetal artesanal extraído del fruto del corozo mediante prensado en frío. Rico en ácido oleico y beta-caroteno, con usos culinarios y cosméticos.",
          """{"presentacion":"250 ml","extraccion":"Prensado en frío","composicion":["Ácido oleico","Beta-caroteno"],"usos":["Culinario","Cosmético"]}""",
          new[] { UOil, ImgCorozo });
        P(5, 1, "Pulpa de Corozo Congelada (500g)", "pulpa-corozo-congelada-500g", 12000m, 100, "AA-PUL-002",
          "Pulpa natural de corozo sin aditivos, ideal para jugos, helados y postres. Fuente natural de vitamina A y antioxidantes, procesada de forma higiénica y sostenible.",
          """{"presentacion":"500 g","conservacion":"Congelada","caracteristicas":["Sin aditivos","Fuente de vitamina A"]}""",
          new[] { UMarket, ImgCorozo });
        P(5, 3, "Jabón Artesanal de Aceite de Corozo", "jabon-artesanal-corozo", 15000m, 75, "AA-JAB-003",
          "Jabón artesanal saponificado en frío con aceite de corozo. Hidratante natural recomendado para piel seca, sin conservantes ni fragancias sintéticas.",
          """{"metodo":"Saponificación en frío","activo":"Aceite de corozo","caracteristicas":["Sin conservantes","Apto piel seca"]}""",
          new[] { USoap, UCream, ImgCorozo });
        P(5, 8, "Artesanías en Semilla de Corozo", "artesanias-semilla-corozo", 28000m, 40, "AA-ART-004",
          "Collar y aretes artesanales tallados en semilla de corozo por artesanos de Caldas. Cada pieza es única y promueve el aprovechamiento integral del fruto.",
          """{"contenido":["Collar","Aretes"],"material":"Semilla de corozo","caracteristicas":["Pieza única","Hecho a mano"]}""",
          new[] { UMarket, ImgCorozo });
        P(5, 13, "Plántulas de Corozo para Restauración (x20)", "plantulas-corozo-restauracion", 60000m, 15, "AA-PLT-005",
          "Lote de 20 plántulas de Acrocomia aculeata con 6 meses de crecimiento, destinadas a la restauración del bosque seco tropical y a sistemas agroforestales.",
          """{"cantidad":"20 plántulas","edad":"6 meses","uso":"Restauración de bosque seco","sistema":"Agroforestal"}""",
          new[] { UTrees, ImgCorozo, UForest2 });
    }
}

/// <summary>A base species (real PostgreSQL <c>species.id</c>) used to derive products and permits.</summary>
internal sealed record SeedSpecies(Guid Id, string Scientific, string Common, string ThumbnailUrl, int SellerIndex);

/// <summary>A marketplace product fully described for deterministic seeding.</summary>
internal sealed record SeedProduct(
    Guid Id,
    Guid SellerId,
    Guid SpeciesId,
    int CategoryId,
    string Name,
    string Slug,
    string Description,
    decimal SellPrice,
    decimal BasePrice,
    int Stock,
    string Sku,
    string CompositionJson,
    string[] Gallery);
