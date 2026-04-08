/**
 * TypeScript types — AI & Computer Vision (FastAPI Microservice).
 * Maps to Pydantic models in app/models/vision.py.
 *
 * Naming: camelCase (TypeScript) ↔ snake_case (Python/JSON).
 * The classification service auto-converts snake_case → camelCase.
 */

// ─── Taxonomy (from CNN metadata) ────────────────────────────────────────────

/** Maps to TaxonomyInfo Pydantic model */
export interface TaxonomyInfo {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    iucnStatus: string;
}

// ─── Geographic Distribution ─────────────────────────────────────────────────

/** Maps to GeoDistribution Pydantic model */
export interface GeoDistribution {
    municipality: string;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    observationDate: string | null;
}

// ─── Species DB Info ─────────────────────────────────────────────────────────

/** Maps to SpeciesDbInfo Pydantic model — enriched data from PostgreSQL */
export interface SpeciesDbInfo {
    foundInDb: boolean;
    dbAlert: string | null;
    speciesId: string | null;
    commonName: string | null;
    description: string | null;
    ecologicalInfo: string | null;
    traditionalUses: string | null;
    economicPotential: string | null;
    conservationStatus: string | null;
    isSensitive: boolean | null;
    thumbnailUrl: string | null;
    distributions: GeoDistribution[];
}

// ─── Prediction ──────────────────────────────────────────────────────────────

/** Maps to SpeciesPrediction Pydantic model */
export interface SpeciesPrediction {
    species: string;
    confidence: number;
    rank: number;
    lowConfidenceAlert: string | null;
    taxonomy: TaxonomyInfo;
    speciesData: SpeciesDbInfo;
}

// ─── Classification Response ─────────────────────────────────────────────────

/** Maps to ClassificationResponse Pydantic model */
export interface ClassificationResponse {
    predictions: SpeciesPrediction[];
    model: string;
    numClasses: number;
    confidenceAlert: string | null;
}

// ─── Model Info ──────────────────────────────────────────────────────────────

/** Maps to ModelInfoResponse Pydantic model */
export interface ModelInfoResponse {
    modelName: string;
    numClasses: number;
    imageSize: number;
    isLoaded: boolean;
    device: string;
    classNames: string[];
}

// ─── Health Check ────────────────────────────────────────────────────────────

/** Maps to the GET /health response */
export interface HealthResponse {
    status: "healthy" | "degraded";
    service: string;
    modelLoaded: boolean;
    numClasses: number;
    databaseConnected: boolean;
    dbSpeciesCount: number;
}

// ─── Model Metrics (Evaluation) ──────────────────────────────────────────────

/** Per-class evaluation metrics from evaluation_metrics.json */
export interface ClassMetrics {
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
}

/** Average metrics (macro/weighted) */
export interface AvgMetrics {
    precision: number;
    recall: number;
    f1Score: number;
}

/** F1-score distribution histogram (10 bins) */
export interface F1Histogram {
    labels: string[];
    counts: number[];
}

/** Support (test sample) distribution by bucket */
export interface SupportDistribution {
    [bucket: string]: number;
}

/** Maps to GET /api/v1/model-metrics response */
export interface ModelMetricsResponse {
    accuracy: number;
    top5Accuracy: number;
    macroAvg: AvgMetrics;
    weightedAvg: AvgMetrics;
    totalEvaluatedSpecies: number;
    totalSamples: number;
    f1Histogram: F1Histogram;
    supportDistribution: SupportDistribution;
    perClass: Record<string, ClassMetrics>;
}

// ─── RAG Chat (future) ──────────────────────────────────────────────────────

/** RAG Chat message */
export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    sources?: ChatSource[];
}

/** RAG source reference */
export interface ChatSource {
    speciesId: string;
    scientificName: string;
    relevanceScore: number;
    snippet: string;
}

// ─── Business Plans ──────────────────────────────────────────────────────────

/** BusinessPlan — mirrors business_plans table */
export interface BusinessPlan {
    id: string;
    entrepreneurId: string;
    projectTitle: string;
    generatedContent: string;
    marketAnalysisData: MarketAnalysisData | null;
    createdAt: string;
}

/** Structured market analysis for dashboard charts */
export interface MarketAnalysisData {
    cagr: string;
    competitors: string[];
    targetMarket: string;
    estimatedRevenue: number;
    [key: string]: unknown;
}

/** Business plan generation request */
export interface GenerateBusinessPlanRequest {
    projectTitle: string;
    speciesIds: string[];
    targetMarket: string;
    additionalContext?: string;
}
