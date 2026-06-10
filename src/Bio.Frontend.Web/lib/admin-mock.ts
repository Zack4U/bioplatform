/**
 * Mock data for admin panel — will be replaced by API calls.
 * @module lib/admin-mock
 */
import type {
    AdminPlatformMetrics, ResearcherMetrics, EntrepreneurMetrics,
    AuthorityMetrics, RevenueChartPoint, RecentActivityItem,
    UserAdminItem, SpeciesAdminItem, ImageAdminItem, ProductAdminItem,
    PermitAdminItem, RequestAdminItem, CnnModelVersion, ChatSessionAdmin,
    RagDocumentAdmin, OrderAdminItem, ReviewAdminItem, TopProductItem,
    RecentRequestItem, AuditLogEntry,
} from "@/types";

export function mockAdminMetrics(): AdminPlatformMetrics {
    return {
        totalUsers: 1247, totalSpecies: 342, totalProducts: 89, totalOrders: 534,
        totalRevenue: 47850000, activePermits: 23, pendingValidations: 18,
        recentActivityCount: 45, userGrowthPercent: 12.5, revenueGrowthPercent: 8.3,
        speciesGrowthPercent: 5.2, ordersGrowthPercent: 15.7,
    };
}

export function mockResearcherMetrics(): ResearcherMetrics {
    return {
        speciesRegistered: 87, pendingValidations: 14, imagesValidated: 234,
        contributionsThisMonth: 12, speciesGrowthPercent: 4.1,
        validationsGrowthPercent: -2.3, imagesGrowthPercent: 18.5,
        contributionsGrowthPercent: 7.8,
        speciesByConservation: { LC: 45, NT: 12, VU: 18, EN: 8, CR: 4 },
        speciesByKingdom: { Plantae: 52, Animalia: 23, Fungi: 12 },
    };
}

export function mockEntrepreneurMetrics(): EntrepreneurMetrics {
    return {
        myProducts: 12, totalSales: 156, totalRevenue: 7250000, averageRating: 4.3,
        productsGrowthPercent: 8.3, salesGrowthPercent: 22.1,
        revenueGrowthPercent: 15.4, ratingChangePercent: 2.1,
        topProducts: [
            { id: "p1", name: "Crema de Orquidea", revenue: 2250000, unitsSold: 50, rating: 4.5 },
            { id: "p2", name: "Aceite de Palma de Cera", revenue: 1800000, unitsSold: 36, rating: 4.2 },
            { id: "p3", name: "Miel de Abejas Nativas", revenue: 1500000, unitsSold: 75, rating: 4.7 },
        ] satisfies TopProductItem[],
        permitStatus: { Active: 3, Expired: 1, Suspended: 0 },
    };
}

export function mockAuthorityMetrics(): AuthorityMetrics {
    return {
        activePermits: 23, pendingRequests: 7, expiringSoon: 4, deniedRequests: 3,
        permitsGrowthPercent: 5.0, requestsGrowthPercent: 12.0,
        expiringGrowthPercent: -8.0, deniedGrowthPercent: 0,
        permitsByStatus: { Active: 23, Expired: 8, Suspended: 2, Revoked: 1 },
        recentRequests: [
            { id: "r1", type: "permit_request", requesterName: "Carlos Mejia", createdAt: "2026-04-25T10:00:00Z", status: "pending" },
            { id: "r2", type: "species_validation", requesterName: "Laura Rios", createdAt: "2026-04-24T14:00:00Z", status: "in_review" },
            { id: "r3", type: "product_approval", requesterName: "Ana Torres", createdAt: "2026-04-23T09:00:00Z", status: "approved" },
        ] satisfies RecentRequestItem[],
    };
}

export function mockRevenueChart(): RevenueChartPoint[] {
    return [
        { month: "Ene", revenue: 3200000, orders: 38 },
        { month: "Feb", revenue: 3800000, orders: 45 },
        { month: "Mar", revenue: 4100000, orders: 52 },
        { month: "Abr", revenue: 3900000, orders: 48 },
        { month: "May", revenue: 4500000, orders: 58 },
        { month: "Jun", revenue: 5200000, orders: 67 },
    ];
}

export function mockRecentActivity(): RecentActivityItem[] {
    return [
        { id: "a1", type: "user_registered", description: "Nuevo usuario registrado", userName: "Maria Lopez", createdAt: "2026-04-28T15:30:00Z" },
        { id: "a2", type: "species_added", description: "Especie agregada: Cattleya trianae", userName: "Dr. Juan Perez", createdAt: "2026-04-28T14:00:00Z" },
        { id: "a3", type: "order_placed", description: "Orden #ORD-2026-534 creada", userName: "Sofia Garcia", createdAt: "2026-04-28T12:30:00Z" },
        { id: "a4", type: "image_validated", description: "Imagen de Quercus humboldtii validada", userName: "Dr. Ana Martinez", createdAt: "2026-04-28T11:00:00Z" },
        { id: "a5", type: "permit_requested", description: "Solicitud de permiso ABS", userName: "Carlos Mejia", createdAt: "2026-04-28T09:00:00Z" },
    ];
}

export function mockUsers(): UserAdminItem[] {
    return [
        { id: "u1", fullName: "Admin Principal", email: "admin@biocommerce.co", phoneNumber: "+573001111111", roles: ["ADMIN"], isActive: true, isVerified: true, twoFactorEnabled: true, lastLogin: "2026-04-28T18:00:00Z", createdAt: "2025-01-01T00:00:00Z", updatedAt: null },
        { id: "u2", fullName: "Dr. Juan Perez", email: "juan.perez@unicaldas.edu.co", phoneNumber: "+573002222222", roles: ["RESEARCHER"], isActive: true, isVerified: true, twoFactorEnabled: false, lastLogin: "2026-04-28T14:00:00Z", createdAt: "2025-02-15T00:00:00Z", updatedAt: null },
        { id: "u3", fullName: "Carlos Mejia", email: "carlos@bioproductos.co", phoneNumber: "+573003333333", roles: ["ENTREPRENEUR"], isActive: true, isVerified: true, twoFactorEnabled: false, lastLogin: "2026-04-27T10:00:00Z", createdAt: "2025-03-20T00:00:00Z", updatedAt: null },
        { id: "u4", fullName: "Dra. Laura Rios", email: "laura.rios@corpocaldas.gov.co", phoneNumber: "+573004444444", roles: ["AUTHORITY"], isActive: true, isVerified: true, twoFactorEnabled: true, lastLogin: "2026-04-28T09:00:00Z", createdAt: "2025-04-10T00:00:00Z", updatedAt: null },
        { id: "u5", fullName: "Sofia Garcia", email: "sofia.g@gmail.com", phoneNumber: "+573005555555", roles: ["BUYER"], isActive: true, isVerified: true, twoFactorEnabled: false, lastLogin: "2026-04-26T16:00:00Z", createdAt: "2025-05-01T00:00:00Z", updatedAt: null },
        { id: "u6", fullName: "Ana Torres", email: "ana.torres@biocomercio.co", phoneNumber: "+573006666666", roles: ["ENTREPRENEUR"], isActive: true, isVerified: true, twoFactorEnabled: false, lastLogin: "2026-04-25T11:00:00Z", createdAt: "2025-06-12T00:00:00Z", updatedAt: null },
        { id: "u7", fullName: "Pedro Ruiz", email: "pedro.ruiz@gmail.com", phoneNumber: null, roles: ["COMMUNITY"], isActive: false, isVerified: false, twoFactorEnabled: false, lastLogin: null, createdAt: "2025-07-20T00:00:00Z", updatedAt: "2026-01-15T00:00:00Z" },
        { id: "u8", fullName: "Dra. Ana Martinez", email: "ana.m@unicaldas.edu.co", phoneNumber: "+573008888888", roles: ["RESEARCHER"], isActive: true, isVerified: true, twoFactorEnabled: false, lastLogin: "2026-04-28T11:00:00Z", createdAt: "2025-08-05T00:00:00Z", updatedAt: null },
    ];
}

export function mockSpecies(): SpeciesAdminItem[] {
    return [
        { id: "s1", scientificName: "Cattleya trianae", commonName: "Flor de Mayo", slug: "cattleya-trianae", kingdom: "Plantae", family: "Orchidaceae", conservationStatus: "VU", isSensitive: true, legalStatus: true, imageCount: 45, distributionCount: 8, thumbnailUrl: null, createdAt: "2025-01-10T00:00:00Z", updatedAt: null },
        { id: "s2", scientificName: "Quercus humboldtii", commonName: "Roble Andino", slug: "quercus-humboldtii", kingdom: "Plantae", family: "Fagaceae", conservationStatus: "VU", isSensitive: false, legalStatus: true, imageCount: 32, distributionCount: 12, thumbnailUrl: null, createdAt: "2025-01-15T00:00:00Z", updatedAt: null },
        { id: "s3", scientificName: "Tremarctos ornatus", commonName: "Oso de Anteojos", slug: "tremarctos-ornatus", kingdom: "Animalia", family: "Ursidae", conservationStatus: "VU", isSensitive: true, legalStatus: true, imageCount: 18, distributionCount: 5, thumbnailUrl: null, createdAt: "2025-02-01T00:00:00Z", updatedAt: null },
        { id: "s4", scientificName: "Ceroxylon quindiuense", commonName: "Palma de Cera", slug: "ceroxylon-quindiuense", kingdom: "Plantae", family: "Arecaceae", conservationStatus: "EN", isSensitive: true, legalStatus: true, imageCount: 56, distributionCount: 15, thumbnailUrl: null, createdAt: "2025-02-10T00:00:00Z", updatedAt: null },
        { id: "s5", scientificName: "Andigena nigrirostris", commonName: "Tucan Andino", slug: "andigena-nigrirostris", kingdom: "Animalia", family: "Ramphastidae", conservationStatus: "NT", isSensitive: false, legalStatus: false, imageCount: 24, distributionCount: 7, thumbnailUrl: null, createdAt: "2025-03-01T00:00:00Z", updatedAt: null },
        { id: "s6", scientificName: "Vanilla planifolia", commonName: "Vainilla", slug: "vanilla-planifolia", kingdom: "Plantae", family: "Orchidaceae", conservationStatus: "LC", isSensitive: false, legalStatus: false, imageCount: 15, distributionCount: 3, thumbnailUrl: null, createdAt: "2025-03-15T00:00:00Z", updatedAt: null },
    ];
}

export function mockImages(): ImageAdminItem[] {
    return [
        { id: "img1", speciesId: "s1", speciesName: "Cattleya trianae", imageUrl: "https://placehold.co/400x300/22c55e/white?text=Cattleya", thumbnailUrl: null, uploaderName: "Dr. Juan Perez", uploaderUserId: "u2", isPrimary: true, isValidatedByExpert: true, validatedByName: "Dra. Ana Martinez", validationDate: "2026-03-15T00:00:00Z", licenseType: "CC-BY", createdAt: "2026-03-10T00:00:00Z" },
        { id: "img2", speciesId: "s1", speciesName: "Cattleya trianae", imageUrl: "https://placehold.co/400x300/16a34a/white?text=Cattleya+2", thumbnailUrl: null, uploaderName: "Carlos Mejia", uploaderUserId: "u3", isPrimary: false, isValidatedByExpert: false, validatedByName: null, validationDate: null, licenseType: "CC-BY-NC", createdAt: "2026-03-12T00:00:00Z" },
        { id: "img3", speciesId: "s2", speciesName: "Quercus humboldtii", imageUrl: "https://placehold.co/400x300/15803d/white?text=Quercus", thumbnailUrl: null, uploaderName: "Dr. Juan Perez", uploaderUserId: "u2", isPrimary: true, isValidatedByExpert: true, validatedByName: "Dr. Juan Perez", validationDate: "2026-02-20T00:00:00Z", licenseType: "CC-BY", createdAt: "2026-02-18T00:00:00Z" },
        { id: "img4", speciesId: "s3", speciesName: "Tremarctos ornatus", imageUrl: "https://placehold.co/400x300/166534/white?text=Oso", thumbnailUrl: null, uploaderName: "Sofia Garcia", uploaderUserId: "u5", isPrimary: false, isValidatedByExpert: false, validatedByName: null, validationDate: null, licenseType: "CC-BY", createdAt: "2026-04-01T00:00:00Z" },
        { id: "img5", speciesId: "s4", speciesName: "Ceroxylon quindiuense", imageUrl: "https://placehold.co/400x300/14532d/white?text=Palma", thumbnailUrl: null, uploaderName: "Dra. Ana Martinez", uploaderUserId: "u8", isPrimary: true, isValidatedByExpert: true, validatedByName: "Dra. Ana Martinez", validationDate: "2026-04-10T00:00:00Z", licenseType: "CC-BY", createdAt: "2026-04-08T00:00:00Z" },
    ];
}

export function mockProducts(): ProductAdminItem[] {
    return [
        { id: "p1", name: "Crema de Orquidea", slug: "crema-de-orquidea", entrepreneurId: "u3", entrepreneurName: "Carlos Mejia", categoryName: "Ingrediente Natural", baseSpeciesName: "Cattleya trianae", price: 45000, stockQuantity: 50, sku: "CRE-ORQ-001", isActive: true, thumbnailUrl: null, rating: 4.5, reviewCount: 12, certificationCount: 2, createdAt: "2025-06-01T00:00:00Z", updatedAt: null },
        { id: "p2", name: "Aceite de Palma de Cera", slug: "aceite-palma-cera", entrepreneurId: "u3", entrepreneurName: "Carlos Mejia", categoryName: "Ingrediente Natural", baseSpeciesName: "Ceroxylon quindiuense", price: 65000, stockQuantity: 30, sku: "ACE-PAL-001", isActive: true, thumbnailUrl: null, rating: 4.2, reviewCount: 8, certificationCount: 1, createdAt: "2025-07-15T00:00:00Z", updatedAt: null },
        { id: "p3", name: "Miel de Abejas Nativas", slug: "miel-abejas-nativas", entrepreneurId: "u6", entrepreneurName: "Ana Torres", categoryName: "Alimento Natural", baseSpeciesName: null, price: 35000, stockQuantity: 100, sku: "MIE-ABE-001", isActive: true, thumbnailUrl: null, rating: 4.7, reviewCount: 25, certificationCount: 3, createdAt: "2025-08-01T00:00:00Z", updatedAt: null },
        { id: "p4", name: "Artesania en Guadua", slug: "artesania-guadua", entrepreneurId: "u6", entrepreneurName: "Ana Torres", categoryName: "Artesania", baseSpeciesName: null, price: 85000, stockQuantity: 15, sku: "ART-GUA-001", isActive: false, thumbnailUrl: null, rating: 3.8, reviewCount: 4, certificationCount: 0, createdAt: "2025-09-10T00:00:00Z", updatedAt: "2026-01-15T00:00:00Z" },
    ];
}

export function mockPermits(): PermitAdminItem[] {
    return [
        { id: "pm1", resolutionNumber: "Res-1348-2024", entrepreneurId: "u3", entrepreneurName: "Carlos Mejia", speciesId: "s1", speciesName: "Cattleya trianae", grantingAuthority: "Corpocaldas", status: "Active", emissionDate: "2024-01-15T00:00:00Z", expirationDate: "2029-01-15T00:00:00Z", legalFramework: "Decreto 3016, Decision 391", requestedAt: "2024-01-05T00:00:00Z" },
        { id: "pm2", resolutionNumber: "Res-2201-2024", entrepreneurId: "u3", entrepreneurName: "Carlos Mejia", speciesId: "s4", speciesName: "Ceroxylon quindiuense", grantingAuthority: "ANLA", status: "Active", emissionDate: "2024-06-01T00:00:00Z", expirationDate: "2029-06-01T00:00:00Z", legalFramework: "Protocolo de Nagoya", requestedAt: "2024-05-20T00:00:00Z" },
        { id: "pm3", resolutionNumber: "Res-0892-2023", entrepreneurId: "u6", entrepreneurName: "Ana Torres", speciesId: "s2", speciesName: "Quercus humboldtii", grantingAuthority: "Corpocaldas", status: "Expired", emissionDate: "2023-03-01T00:00:00Z", expirationDate: "2025-03-01T00:00:00Z", legalFramework: "Decision 391", requestedAt: "2023-02-15T00:00:00Z" },
        { id: "pm4", resolutionNumber: "Res-1567-2025", entrepreneurId: "u6", entrepreneurName: "Ana Torres", speciesId: "s6", speciesName: "Vanilla planifolia", grantingAuthority: "MinAmbiente", status: "Active", emissionDate: "2025-09-01T00:00:00Z", expirationDate: "2030-09-01T00:00:00Z", legalFramework: "Decreto 3016", requestedAt: "2025-08-20T00:00:00Z" },
    ];
}

export function mockRequests(): RequestAdminItem[] {
    return [
        { id: "rq1", type: "permit_request", requesterId: "u3", requesterName: "Carlos Mejia", subject: "Permiso ABS para Vanilla planifolia", description: "Solicitud de acceso a recursos geneticos de Vanilla planifolia para produccion de extractos.", status: "pending", referenceId: "s6", referenceType: "species", reviewerNotes: null, createdAt: "2026-04-25T10:00:00Z", updatedAt: null },
        { id: "rq2", type: "species_validation", requesterId: "u2", requesterName: "Dr. Juan Perez", subject: "Validacion de Epidendrum secundum", description: "Nueva especie fotografiada en el PNN Los Nevados, requiere validacion taxonomica.", status: "in_review", referenceId: null, referenceType: null, reviewerNotes: "Revisando taxonomia con herbario.", createdAt: "2026-04-24T14:00:00Z", updatedAt: "2026-04-26T09:00:00Z" },
        { id: "rq3", type: "product_approval", requesterId: "u6", requesterName: "Ana Torres", subject: "Aprobacion de nuevo producto: Jabon de Calendula", description: "Producto derivado de calendula cultivada organicamente.", status: "approved", referenceId: "p5", referenceType: "product", reviewerNotes: "Certificaciones verificadas.", createdAt: "2026-04-20T09:00:00Z", updatedAt: "2026-04-22T15:00:00Z" },
        { id: "rq4", type: "account_verification", requesterId: "u7", requesterName: "Pedro Ruiz", subject: "Verificacion de cuenta comunitaria", description: "Comunidad indigena Embera Chami solicita verificacion.", status: "pending", referenceId: "u7", referenceType: "user", reviewerNotes: null, createdAt: "2026-04-22T11:00:00Z", updatedAt: null },
    ];
}

export function mockCnnModels(): CnnModelVersion[] {
    return [
        { id: 1, modelName: "EfficientNet-B4", version: "v2.1.0", accuracyMetric: 0.9120, validationAccuracy: null, deployedAt: "2026-04-01T00:00:00Z", isActive: true, notes: "Improved accuracy with augmented dataset", createdAt: "2026-04-01T00:00:00Z" },
        { id: 2, modelName: "EfficientNet-B4", version: "v2.0.0", accuracyMetric: 0.8950, validationAccuracy: null, deployedAt: "2026-02-15T00:00:00Z", isActive: false, notes: "Added 50 new species classes", createdAt: "2026-02-15T00:00:00Z" },
        { id: 3, modelName: "ResNet50", version: "v1.2.0", accuracyMetric: 0.8750, validationAccuracy: null, deployedAt: "2025-12-01T00:00:00Z", isActive: false, notes: "ResNet baseline with transfer learning", createdAt: "2025-12-01T00:00:00Z" },
        { id: 4, modelName: "ResNet50", version: "v1.0.0", accuracyMetric: 0.8520, validationAccuracy: null, deployedAt: "2025-09-01T00:00:00Z", isActive: false, notes: "Initial release", createdAt: "2025-09-01T00:00:00Z" },
    ];
}

export function mockChatSessions(): ChatSessionAdmin[] {
    return [
        { id: "cs1", userId: "u3", userName: "Carlos Mejia", contextTopic: "Biocommerce", messageCount: 12, startedAt: "2026-04-28T10:00:00Z", lastMessageAt: "2026-04-28T10:45:00Z" },
        { id: "cs2", userId: "u5", userName: "Sofia Garcia", contextTopic: "Taxonomy", messageCount: 8, startedAt: "2026-04-27T14:00:00Z", lastMessageAt: "2026-04-27T14:30:00Z" },
        { id: "cs3", userId: "u6", userName: "Ana Torres", contextTopic: "Conservation", messageCount: 15, startedAt: "2026-04-26T09:00:00Z", lastMessageAt: "2026-04-26T10:00:00Z" },
        { id: "cs4", userId: "u2", userName: "Dr. Juan Perez", contextTopic: "Taxonomy", messageCount: 5, startedAt: "2026-04-25T16:00:00Z", lastMessageAt: "2026-04-25T16:20:00Z" },
    ];
}

export function mockRagDocuments(): RagDocumentAdmin[] {
    return [
        { id: "rd1", title: "Cattleya trianae - Ficha Tecnica", sourceType: "Species", sourceUrl: null, speciesName: "Cattleya trianae", chunkCount: 8, createdAt: "2025-06-01T00:00:00Z" },
        { id: "rd2", title: "Guia de Biocomercio Sostenible", sourceType: "Manual", sourceUrl: "https://minambiente.gov.co/guia-biocomercio", speciesName: null, chunkCount: 24, createdAt: "2025-07-15T00:00:00Z" },
        { id: "rd3", title: "Protocolo de Nagoya - Resumen", sourceType: "Paper", sourceUrl: "https://cbd.int/abs", speciesName: null, chunkCount: 12, createdAt: "2025-08-01T00:00:00Z" },
    ];
}

export function mockOrders(): OrderAdminItem[] {
    return [
        { id: "o1", orderNumber: "ORD-2026-534", buyerId: "u5", buyerName: "Sofia Garcia", buyerEmail: "sofia.g@gmail.com", totalAmount: 90000, subtotalAmount: 75630, taxAmount: 14370, shippingAmount: 0, discountAmount: 0, status: "Paid", paymentMethod: "Stripe", transactionRef: "pi_1De123", itemCount: 2, createdAt: "2026-04-28T12:00:00Z", updatedAt: null },
        { id: "o2", orderNumber: "ORD-2026-533", buyerId: "u5", buyerName: "Sofia Garcia", buyerEmail: "sofia.g@gmail.com", totalAmount: 45000, subtotalAmount: 37815, taxAmount: 7185, shippingAmount: 12000, discountAmount: 12000, status: "Shipped", paymentMethod: "PSE", transactionRef: "pse_abc456", itemCount: 1, createdAt: "2026-04-25T09:00:00Z", updatedAt: "2026-04-26T10:00:00Z" },
        { id: "o3", orderNumber: "ORD-2026-532", buyerId: "u7", buyerName: "Pedro Ruiz", buyerEmail: "pedro.ruiz@gmail.com", totalAmount: 150000, subtotalAmount: 126050, taxAmount: 23950, shippingAmount: 0, discountAmount: 0, status: "Delivered", paymentMethod: "Stripe", transactionRef: "pi_2Ef789", itemCount: 3, createdAt: "2026-04-20T14:00:00Z", updatedAt: "2026-04-24T08:00:00Z" },
        { id: "o4", orderNumber: "ORD-2026-531", buyerId: "u5", buyerName: "Sofia Garcia", buyerEmail: "sofia.g@gmail.com", totalAmount: 35000, subtotalAmount: 29412, taxAmount: 5588, shippingAmount: 12000, discountAmount: 12000, status: "Cancelled", paymentMethod: "PSE", transactionRef: null, itemCount: 1, createdAt: "2026-04-18T16:00:00Z", updatedAt: "2026-04-19T09:00:00Z" },
    ];
}

export function mockReviews(): ReviewAdminItem[] {
    return [
        { id: "rv1", productId: "p1", productName: "Crema de Orquidea", productSlug: "crema-de-orquidea", userId: "u5", userName: "Sofia Garcia", rating: 5, title: "Excelente calidad", comment: "La crema es maravillosa, deja la piel suave e hidratada. Totalmente recomendada.", isFlagged: false, createdAt: "2026-04-15T10:00:00Z" },
        { id: "rv2", productId: "p1", productName: "Crema de Orquidea", productSlug: "crema-de-orquidea", userId: "u7", userName: "Pedro Ruiz", rating: 4, title: "Buen producto", comment: "Buena calidad pero el empaque podria mejorar.", isFlagged: false, createdAt: "2026-04-10T14:00:00Z" },
        { id: "rv3", productId: "p3", productName: "Miel de Abejas Nativas", productSlug: "miel-abejas-nativas", userId: "u5", userName: "Sofia Garcia", rating: 5, title: "La mejor miel", comment: "Sabor unico, se nota que es miel pura de abejas nativas.", isFlagged: false, createdAt: "2026-04-08T09:00:00Z" },
        { id: "rv4", productId: "p4", productName: "Artesania en Guadua", productSlug: "artesania-guadua", userId: "u7", userName: "Pedro Ruiz", rating: 2, title: "Llego danada", comment: "El producto llego con defectos. No recomiendo.", isFlagged: true, createdAt: "2026-04-05T16:00:00Z" },
    ];
}

export function mockAuditLog(): AuditLogEntry[] {
    return [
        { id: "al1", action: "user.login", entityType: "User", entityId: "u1", entityName: "Admin Principal", performedBy: "u1", performedByName: "Admin Principal", ipAddress: "190.25.100.42", details: "Inicio de sesion exitoso", createdAt: "2026-04-28T18:00:00Z" },
        { id: "al2", action: "user.role_changed", entityType: "User", entityId: "u7", entityName: "Pedro Ruiz", performedBy: "u1", performedByName: "Admin Principal", ipAddress: "190.25.100.42", details: "Rol cambiado de BUYER a COMMUNITY", createdAt: "2026-04-28T17:30:00Z" },
        { id: "al3", action: "species.created", entityType: "Species", entityId: "s6", entityName: "Vanilla planifolia", performedBy: "u2", performedByName: "Dr. Juan Perez", ipAddress: "186.80.45.12", details: "Nueva especie registrada en el catalogo", createdAt: "2026-04-28T14:00:00Z" },
        { id: "al4", action: "permit.approved", entityType: "Permit", entityId: "pm4", entityName: "Res-1567-2025", performedBy: "u4", performedByName: "Dra. Laura Rios", ipAddress: "200.12.30.88", details: "Permiso ABS aprobado para Vanilla planifolia", createdAt: "2026-04-28T11:00:00Z" },
        { id: "al5", action: "image.validated", entityType: "Image", entityId: "img5", entityName: "Ceroxylon quindiuense - Foto 1", performedBy: "u8", performedByName: "Dra. Ana Martinez", ipAddress: "186.80.45.15", details: "Imagen validada por experto", createdAt: "2026-04-28T10:30:00Z" },
        { id: "al6", action: "product.updated", entityType: "Product", entityId: "p4", entityName: "Artesania en Guadua", performedBy: "u6", performedByName: "Ana Torres", ipAddress: "190.25.100.50", details: "Producto desactivado por falta de stock", createdAt: "2026-04-27T16:00:00Z" },
        { id: "al7", action: "order.status_changed", entityType: "Order", entityId: "o2", entityName: "ORD-2026-533", performedBy: "u3", performedByName: "Carlos Mejia", ipAddress: "190.25.100.55", details: "Estado cambiado de Paid a Shipped", createdAt: "2026-04-26T10:00:00Z" },
        { id: "al8", action: "review.flagged", entityType: "Review", entityId: "rv4", entityName: "Resena de Artesania en Guadua", performedBy: "u1", performedByName: "Admin Principal", ipAddress: "190.25.100.42", details: "Resena marcada como inapropiada", createdAt: "2026-04-26T09:00:00Z" },
        { id: "al9", action: "model.deployed", entityType: "AiModel", entityId: "1", entityName: "EfficientNet-B4 v2.1.0", performedBy: "u1", performedByName: "Admin Principal", ipAddress: "190.25.100.42", details: "Nuevo modelo de IA desplegado en produccion", createdAt: "2026-04-25T15:00:00Z" },
        { id: "al10", action: "user.deactivated", entityType: "User", entityId: "u7", entityName: "Pedro Ruiz", performedBy: "u1", performedByName: "Admin Principal", ipAddress: "190.25.100.42", details: "Cuenta desactivada por inactividad", createdAt: "2026-04-24T14:00:00Z" },
        { id: "al11", action: "request.approved", entityType: "Request", entityId: "rq3", entityName: "Aprobacion de Jabon de Calendula", performedBy: "u1", performedByName: "Admin Principal", ipAddress: "190.25.100.42", details: "Solicitud de aprobacion de producto aceptada", createdAt: "2026-04-22T15:00:00Z" },
        { id: "al12", action: "user.login_failed", entityType: "User", entityId: "u7", entityName: "Pedro Ruiz", performedBy: "u7", performedByName: "Pedro Ruiz", ipAddress: "181.55.22.33", details: "Intento de inicio de sesion fallido (3er intento)", createdAt: "2026-04-21T08:00:00Z" },
    ];
}
