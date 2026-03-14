/**
 * TypeScript types — AI & Computer Vision (PostgreSQL / FastAPI)
 * Maps to: BioCommerce_Scientific AI context + Python microservice DTOs
 */

/** PredictionLog — mirrors prediction_logs table */
export interface PredictionLog {
    id: string;
    imageInputUrl: string;
    rawPredictionResult: PredictionResult[];
    confidenceScore: number;
    feedbackCorrect: boolean | null;
    createdAt: string;
}

/** Single prediction entry (top-K output from CNN) */
export interface PredictionResult {
    class: string;
    speciesId: string | null;
    probability: number;
}

/** Classification request to FastAPI (React Native) */
export interface ClassifyImageRequest {
    /** URI del archivo de imagen local (e.g., from Vision Camera or ImagePicker) */
    imageUri: string;
    /** Nombre del archivo (opcional, para FormData) */
    fileName?: string;
    /** MIME type (e.g., "image/jpeg", "image/png") */
    mimeType?: string;
}

/** Classification response from FastAPI */
export interface ClassifyImageResponse {
    predictions: PredictionResult[];
    topPrediction: {
        speciesId: string;
        scientificName: string;
        commonName: string | null;
        confidence: number;
    };
    processingTimeMs: number;
}

/** BusinessPlan — mirrors business_plans table */
export interface BusinessPlan {
    id: string;
    entrepreneurId: string;
    projectTitle: string;
    generatedContent: string; // Markdown
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

/** Business plan generation request */
export interface GenerateBusinessPlanRequest {
    projectTitle: string;
    speciesIds: string[];
    targetMarket: string;
    additionalContext?: string;
}
