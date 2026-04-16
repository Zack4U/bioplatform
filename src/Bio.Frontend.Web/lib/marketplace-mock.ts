/**
 * Mock data factory for the Marketplace feature.
 *
 * All mock data is centralized here — when backend endpoints are ready,
 * replace the service functions in `marketplace-service.ts` with real API calls.
 *
 * @module lib/marketplace-mock
 */

import type {
    Address,
    CouponCode,
    ProductCategory,
    ProductCert,
    ProductDetailDTO,
    ProductListItem,
    Review,
    TraceabilityBatch,
} from "@/types/marketplace";

// ── Categories ───────────────────────────────────────────────────────────────

export const MOCK_CATEGORIES: ProductCategory[] = [
    {
        id: 1,
        name: "Ingrediente Natural",
        slug: "ingrediente-natural",
        productCount: 5,
    },
    { id: 2, name: "Artesanía", slug: "artesania", productCount: 3 },
    {
        id: 3,
        name: "Cosmético Natural",
        slug: "cosmetico-natural",
        productCount: 4,
    },
    {
        id: 4,
        name: "Alimento Orgánico",
        slug: "alimento-organico",
        productCount: 3,
    },
    { id: 5, name: "Ecoturismo", slug: "ecoturismo", productCount: 2 },
    {
        id: 6,
        name: "Producto Medicinal",
        slug: "producto-medicinal",
        productCount: 2,
    },
];

// ── Certifications ───────────────────────────────────────────────────────────

const CERT_NEGOCIOS_VERDES: ProductCert = {
    certId: "cert-nv-001",
    certName: "Negocios Verdes",
    issuer: "MinAmbiente",
    logoUrl: null,
    validUntil: "2027-12-31",
    verificationCode: "NV-2025-00421",
};

const CERT_RAINFOREST: ProductCert = {
    certId: "cert-ra-001",
    certName: "Rainforest Alliance",
    issuer: "Rainforest Alliance International",
    logoUrl: null,
    validUntil: "2026-06-30",
    verificationCode: "RA-COL-2025-112",
};

const CERT_ORGANICO: ProductCert = {
    certId: "cert-org-001",
    certName: "Orgánico Certificado",
    issuer: "BCS Öko-Garantie",
    logoUrl: null,
    validUntil: "2026-12-31",
    verificationCode: "ORG-COL-5542",
};

const CERT_COMERCIO_JUSTO: ProductCert = {
    certId: "cert-cj-001",
    certName: "Comercio Justo",
    issuer: "Fairtrade International",
    logoUrl: null,
    validUntil: "2027-03-15",
    verificationCode: "FT-2025-COL-089",
};

// ── Traceability ─────────────────────────────────────────────────────────────

export const MOCK_BATCHES: TraceabilityBatch[] = [
    {
        id: "batch-001",
        batchCode: "LOT-2025-001",
        harvestDate: "2025-03-10",
        originLocation: "Vereda La Esperanza, Manizales",
        processingDetails:
            "Secado al sol durante 5 días. Selección manual de semillas maduras.",
        blockchainHash: "0x4a3b2c1d...",
    },
    {
        id: "batch-002",
        batchCode: "LOT-2025-002",
        harvestDate: "2025-04-02",
        originLocation: "Vereda El Rosario, Villamaría",
        processingDetails:
            "Recolección artesanal. Procesamiento en frío para preservar compuestos activos.",
        blockchainHash: null,
    },
];

// ── Reviews ──────────────────────────────────────────────────────────────────

export const MOCK_REVIEWS: Review[] = [
    {
        id: "rev-001",
        productId: "prod-001",
        userId: "user-001",
        userName: "María Rodríguez",
        rating: 5,
        comment:
            "Excelente calidad, el aroma es increíble y la piel queda muy suave. 100% recomendado.",
        createdAt: "2025-03-15T09:00:00Z",
    },
    {
        id: "rev-002",
        productId: "prod-001",
        userId: "user-002",
        userName: "Carlos Mejía",
        rating: 4,
        comment:
            "Muy buen producto. El empaque es bonito y la textura agradable. Repetiré la compra.",
        createdAt: "2025-03-20T14:30:00Z",
    },
    {
        id: "rev-003",
        productId: "prod-001",
        userId: "user-003",
        userName: "Ana Gómez",
        rating: 5,
        comment:
            "Me encantó. Se nota que es natural y artesanal. Llegó muy bien empacado.",
        createdAt: "2025-04-01T10:45:00Z",
    },
    {
        id: "rev-004",
        productId: "prod-002",
        userId: "user-004",
        userName: "Pedro Salazar",
        rating: 4,
        comment:
            "Buen café, se nota el origen único. El empaque podría mejorar para conservar mejor el aroma.",
        createdAt: "2025-03-18T08:00:00Z",
    },
    {
        id: "rev-005",
        productId: "prod-002",
        userId: "user-005",
        userName: "Laura Vásquez",
        rating: 5,
        comment:
            "El mejor café que he probado. Notas florales únicas gracias a la biodiversidad de la zona.",
        createdAt: "2025-03-25T16:20:00Z",
    },
    {
        id: "rev-006",
        productId: "prod-003",
        userId: "user-001",
        userName: "María Rodríguez",
        rating: 3,
        comment:
            "El sabor es interesante pero no para todos. Bastante particular.",
        createdAt: "2025-04-02T11:00:00Z",
    },
];

// ── Products ─────────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS: ProductListItem[] = [
    {
        id: "prod-001",
        slug: "crema-de-orquidea",
        name: "Crema Hidratante de Orquídea",
        price: 45000,
        originalPrice: 55000,
        sku: "CRE-ORQ-001",
        isActive: true,
        stockQuantity: 50,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "BioBeauty Caldas",
        categoryName: "Cosmético Natural",
        baseSpeciesName: "Cattleya trianae",
        rating: 4.7,
        reviewCount: 23,
        certifications: ["Negocios Verdes", "Orgánico Certificado"],
    },
    {
        id: "prod-002",
        slug: "cafe-de-sombra-paramo",
        name: "Café de Sombra del Páramo",
        price: 32000,
        sku: "CAF-SOM-001",
        isActive: true,
        stockQuantity: 120,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "Cultivos Sostenibles Caldas",
        categoryName: "Alimento Orgánico",
        baseSpeciesName: "Coffea arabica",
        rating: 4.9,
        reviewCount: 45,
        certifications: ["Rainforest Alliance", "Comercio Justo"],
    },
    {
        id: "prod-003",
        slug: "miel-de-abeja-nativa",
        name: "Miel de Abeja Nativa Silvestre",
        price: 28000,
        sku: "MIE-NAT-001",
        isActive: true,
        stockQuantity: 35,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "Apiarios del Ruiz",
        categoryName: "Alimento Orgánico",
        baseSpeciesName: "Tetragonisca angustula",
        rating: 4.5,
        reviewCount: 18,
        certifications: ["Negocios Verdes"],
    },
    {
        id: "prod-004",
        slug: "aceite-esencial-eucalipto",
        name: "Aceite Esencial de Eucalipto Andino",
        price: 38000,
        originalPrice: 42000,
        sku: "ACE-EUC-001",
        isActive: true,
        stockQuantity: 60,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "EsenciasVivas",
        categoryName: "Producto Medicinal",
        baseSpeciesName: "Eucalyptus globulus",
        rating: 4.3,
        reviewCount: 12,
        certifications: ["Orgánico Certificado"],
    },
    {
        id: "prod-005",
        slug: "artesania-guadua-tallada",
        name: "Artesanía en Guadua Tallada",
        price: 85000,
        sku: "ART-GUA-001",
        isActive: true,
        stockQuantity: 15,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "Guadua & Arte Caldas",
        categoryName: "Artesanía",
        baseSpeciesName: "Guadua angustifolia",
        rating: 4.8,
        reviewCount: 8,
        certifications: ["Negocios Verdes", "Comercio Justo"],
    },
    {
        id: "prod-006",
        slug: "te-herbal-andino",
        name: "Té Herbal Andino — Mezcla Páramo",
        price: 22000,
        sku: "TEH-AND-001",
        isActive: true,
        stockQuantity: 200,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "Infusiones del Nevado",
        categoryName: "Alimento Orgánico",
        baseSpeciesName: "Baccharis latifolia",
        rating: 4.4,
        reviewCount: 31,
        certifications: ["Orgánico Certificado"],
    },
    {
        id: "prod-007",
        slug: "jabon-artesanal-calendula",
        name: "Jabón Artesanal de Caléndula",
        price: 18000,
        sku: "JAB-CAL-001",
        isActive: true,
        stockQuantity: 80,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "BioBeauty Caldas",
        categoryName: "Cosmético Natural",
        baseSpeciesName: "Calendula officinalis",
        rating: 4.6,
        reviewCount: 15,
        certifications: ["Negocios Verdes"],
    },
    {
        id: "prod-008",
        slug: "tintura-madre-valeriana",
        name: "Tintura Madre de Valeriana Silvestre",
        price: 35000,
        sku: "TIN-VAL-001",
        isActive: true,
        stockQuantity: 45,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "Herbolaria Caldense",
        categoryName: "Producto Medicinal",
        baseSpeciesName: "Valeriana officinalis",
        rating: 4.2,
        reviewCount: 9,
        certifications: [],
    },
    {
        id: "prod-009",
        slug: "bolso-fique-tejido",
        name: "Bolso de Fique Tejido a Mano",
        price: 65000,
        sku: "BOL-FIQ-001",
        isActive: true,
        stockQuantity: 25,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "Tejidos Ancestrales",
        categoryName: "Artesanía",
        baseSpeciesName: "Furcraea andina",
        rating: 4.9,
        reviewCount: 20,
        certifications: ["Comercio Justo"],
    },
    {
        id: "prod-010",
        slug: "chocolate-cacao-silvestre",
        name: "Chocolate de Cacao Silvestre 70%",
        price: 25000,
        sku: "CHO-CAC-001",
        isActive: true,
        stockQuantity: 90,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "Cacao & Selva",
        categoryName: "Alimento Orgánico",
        baseSpeciesName: "Theobroma cacao",
        rating: 4.7,
        reviewCount: 38,
        certifications: ["Rainforest Alliance", "Orgánico Certificado"],
    },
    {
        id: "prod-011",
        slug: "tour-avistamiento-aves",
        name: "Tour Avistamiento de Aves — Río Blanco",
        price: 120000,
        sku: "ECO-AVE-001",
        isActive: true,
        stockQuantity: 10,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "EcoTurismo Caldas",
        categoryName: "Ecoturismo",
        baseSpeciesName: null,
        rating: 5.0,
        reviewCount: 14,
        certifications: ["Negocios Verdes"],
    },
    {
        id: "prod-012",
        slug: "serum-facial-bromelias",
        name: "Sérum Facial de Extracto de Bromelias",
        price: 52000,
        originalPrice: 60000,
        sku: "SER-BRO-001",
        isActive: true,
        stockQuantity: 30,
        thumbnailUrl:
            "https://www.mockupworld.co/wp-content/uploads/dynamic/2026/03/free-stand-up-pouch-mockup-psd-536x0-c-default.jpg",
        entrepreneurName: "BioBeauty Caldas",
        categoryName: "Cosmético Natural",
        baseSpeciesName: "Aechmea angustifolia",
        rating: 4.5,
        reviewCount: 11,
        certifications: ["Negocios Verdes", "Orgánico Certificado"],
    },
];

// ── Product Detail builder ───────────────────────────────────────────────────

/** Build a full ProductDetailDTO from a ProductListItem (mock enrichment). */
export function buildMockProductDetail(
    listItem: ProductListItem,
): ProductDetailDTO {
    const productReviews = MOCK_REVIEWS.filter(
        (r) => r.productId === listItem.id,
    );

    // If no reviews found for this specific product, generate some
    const reviews =
        productReviews.length > 0
            ? productReviews
            : MOCK_REVIEWS.slice(0, 2).map((r, i) => ({
                  ...r,
                  id: `${r.id}-${listItem.id}-${i}`,
                  productId: listItem.id,
              }));

    const certs: ProductCert[] = [];
    if (listItem.certifications.includes("Negocios Verdes"))
        certs.push(CERT_NEGOCIOS_VERDES);
    if (listItem.certifications.includes("Rainforest Alliance"))
        certs.push(CERT_RAINFOREST);
    if (listItem.certifications.includes("Orgánico Certificado"))
        certs.push(CERT_ORGANICO);
    if (listItem.certifications.includes("Comercio Justo"))
        certs.push(CERT_COMERCIO_JUSTO);

    return {
        id: listItem.id,
        slug: listItem.slug,
        entrepreneurId: "ent-001",
        entrepreneurName: listItem.entrepreneurName,
        baseSpeciesId: "species-001",
        baseSpeciesName: listItem.baseSpeciesName,
        baseSpeciesSlug: listItem.baseSpeciesName
            ? listItem.baseSpeciesName.toLowerCase().replace(/\s+/g, "-")
            : null,
        categoryId:
            MOCK_CATEGORIES.find((c) => c.name === listItem.categoryName)?.id ??
            null,
        categoryName: listItem.categoryName,
        name: listItem.name,
        description: buildMockDescription(listItem),
        price: listItem.price,
        originalPrice: listItem.originalPrice,
        stockQuantity: listItem.stockQuantity,
        sku: listItem.sku,
        isActive: listItem.isActive,
        images: [
            {
                id: `img-${listItem.id}-1`,
                productId: listItem.id,
                imageUrl: listItem.thumbnailUrl ?? "/images/placeholder.webp",
                altText: listItem.name,
                isPrimary: true,
                sortOrder: 0,
            },
            {
                id: `img-${listItem.id}-2`,
                productId: listItem.id,
                imageUrl: listItem.thumbnailUrl ?? "/images/placeholder.webp",
                altText: `${listItem.name} — vista lateral`,
                isPrimary: false,
                sortOrder: 1,
            },
            {
                id: `img-${listItem.id}-3`,
                productId: listItem.id,
                imageUrl: listItem.thumbnailUrl ?? "/images/placeholder.webp",
                altText: `${listItem.name} — empaque`,
                isPrimary: false,
                sortOrder: 2,
            },
        ],
        certifications: certs,
        traceability: MOCK_BATCHES,
        reviews,
        rating: listItem.rating,
        reviewCount: listItem.reviewCount,
        createdAt: "2025-01-20T08:00:00Z",
    };
}

function buildMockDescription(item: ProductListItem): string {
    return (
        `${item.name} es un producto de biocomercio sostenible originario del departamento de Caldas, Colombia. ` +
        `Elaborado artesanalmente por ${item.entrepreneurName}, este producto ` +
        (item.baseSpeciesName
            ? `utiliza como materia prima la especie ${item.baseSpeciesName}, `
            : "") +
        `cumpliendo con todos los permisos de acceso a recursos genéticos (Protocolo de Nagoya). ` +
        `\n\nCada unidad es cuidadosamente preparada siguiendo prácticas de producción sostenible ` +
        `que benefician directamente a las comunidades locales y contribuyen a la conservación ` +
        `de la biodiversidad del Eje Cafetero.`
    );
}

// ── Addresses ────────────────────────────────────────────────────────────────

export const MOCK_ADDRESSES: Address[] = [
    {
        id: "addr-001",
        label: "Casa",
        fullName: "María Rodríguez",
        phone: "+573001234567",
        addressLine1: "Calle 65 #23-45",
        addressLine2: "Apto 301",
        city: "Manizales",
        department: "Caldas",
        postalCode: "170001",
        country: "Colombia",
        isDefault: true,
    },
    {
        id: "addr-002",
        label: "Oficina",
        fullName: "María Rodríguez",
        phone: "+573007654321",
        addressLine1: "Carrera 23 #64-12",
        addressLine2: "Oficina 502, Edificio Centro",
        city: "Manizales",
        department: "Caldas",
        postalCode: "170001",
        country: "Colombia",
        isDefault: false,
    },
];

// ── Coupons ──────────────────────────────────────────────────────────────────

export const MOCK_COUPONS: Record<string, CouponCode> = {
    BIO10: {
        code: "BIO10",
        discountType: "percentage",
        discountValue: 10,
        minOrderAmount: 50000,
        isValid: true,
        description: "10% de descuento en compras mayores a $50.000",
    },
    CALDAS5000: {
        code: "CALDAS5000",
        discountType: "fixed",
        discountValue: 5000,
        minOrderAmount: 30000,
        isValid: true,
        description: "$5.000 de descuento en compras mayores a $30.000",
    },
    EXPIRADO: {
        code: "EXPIRADO",
        discountType: "percentage",
        discountValue: 20,
        minOrderAmount: 0,
        isValid: false,
        description: "Cupón expirado",
    },
};
