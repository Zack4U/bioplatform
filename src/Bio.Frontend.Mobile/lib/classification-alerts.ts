import type { ClassificationResponse, SpeciesPrediction } from "@/types";

export type ClassificationAlertTone = "destructive" | "warning" | "info";

export interface ClassificationAlert {
    id: string;
    tone: ClassificationAlertTone;
    message: string;
}

type AlertKind =
    | "confidence-low"
    | "db-unavailable"
    | "db-not-found"
    | "generic";

const CANONICAL_MESSAGES: Record<Exclude<AlertKind, "generic">, string> = {
    "confidence-low":
        "La confianza de la prediccion es baja. Verifica manualmente.",
    "db-unavailable":
        "No fue posible consultar la base de datos en este momento. Solo se muestran resultados del modelo.",
    "db-not-found":
        "No se encontro un registro de esta especie en la base de datos. Solo se muestran predicciones del modelo.",
};

// Backend templates in app/api/v1_classify.py:
// - "Low confidence (...) Below reliability threshold (...). This prediction may not be accurate."
// - "Top prediction confidence (...) is below the reliability threshold (...). Results may be unreliable..."
// This pattern also tolerates typo variants observed in runtime logs (predition, realibility, imager).
const CONFIDENCE_PATTERN =
    /(low\s*confidence|top\s*predi\w*\s*confidence|reliab\w*\s*threshold|results\s*may\s*be\s*unreliable|predi\w*\s*may\s*not\s*be\s*accurate|clearer\s*imag\w*)/i;

// Backend templates in _enrich_from_db:
// - "Database connection unavailable. Showing CNN results only."
// - "No database record found for '<species>'. Only CNN predictions are available."
const DB_UNAVAILABLE_PATTERN =
    /database\s*connection\s*unavailable|database\s*(unavailable|offline|error|timeout|connection\s*failed)/i;
const DB_NOT_FOUND_PATTERN =
    /no\s*database\s*record\s*found|only\s*cnn\s*predictions\s*are\s*available|species\s*not\s*found|not\s*found\s*in\s*(the\s*)?(database|db)/i;

function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function classifyAlert(rawMessage: string): {
    kind: AlertKind;
    message: string;
    tone: ClassificationAlertTone;
} {
    const raw = rawMessage.trim();

    if (CONFIDENCE_PATTERN.test(raw)) {
        return {
            kind: "confidence-low",
            message: CANONICAL_MESSAGES["confidence-low"],
            tone: "warning",
        };
    }

    if (DB_UNAVAILABLE_PATTERN.test(raw)) {
        return {
            kind: "db-unavailable",
            message: CANONICAL_MESSAGES["db-unavailable"],
            tone: "info",
        };
    }

    if (DB_NOT_FOUND_PATTERN.test(raw)) {
        return {
            kind: "db-not-found",
            message: CANONICAL_MESSAGES["db-not-found"],
            tone: "info",
        };
    }

    return {
        kind: "generic",
        message: raw,
        tone: "warning",
    };
}

const TONE_RANK: Record<ClassificationAlertTone, number> = {
    info: 1,
    warning: 2,
    destructive: 3,
};

function upsertAlert(
    bucket: Map<string, ClassificationAlert>,
    fallbackTone: ClassificationAlertTone,
    rawMessage: string | null | undefined,
): void {
    if (!rawMessage) {
        return;
    }

    const parsed = classifyAlert(rawMessage);
    if (!parsed.message) {
        return;
    }

    const dedupeKey =
        parsed.kind === "generic"
            ? `generic:${normalizeText(parsed.message)}`
            : parsed.kind;
    const targetTone: ClassificationAlertTone =
        parsed.kind === "generic" ? fallbackTone : parsed.tone;
    const existing = bucket.get(dedupeKey);

    if (existing) {
        const strongerTone =
            TONE_RANK[targetTone] > TONE_RANK[existing.tone]
                ? targetTone
                : existing.tone;

        bucket.set(dedupeKey, {
            ...existing,
            tone: strongerTone,
        });
        return;
    }

    bucket.set(dedupeKey, {
        id: dedupeKey,
        tone: targetTone,
        message: parsed.message,
    });
}

function confidenceTone(
    message: string | null | undefined,
): ClassificationAlertTone {
    if (!message) {
        return "warning";
    }

    const normalized = normalizeText(message);
    if (
        normalized.includes("confidence") ||
        normalized.includes("threshold") ||
        normalized.includes("unreliable")
    ) {
        return "warning";
    }

    if (normalized.includes("critical") || normalized.includes("very low")) {
        return "destructive";
    }

    return "warning";
}

export function getClassificationAlerts(
    result: ClassificationResponse,
    topPrediction: SpeciesPrediction,
): ClassificationAlert[] {
    const alertsMap = new Map<string, ClassificationAlert>();

    // Keep both sources, dedupe semantically by alert kind.
    upsertAlert(
        alertsMap,
        confidenceTone(result.confidenceAlert),
        result.confidenceAlert,
    );
    upsertAlert(
        alertsMap,
        confidenceTone(topPrediction.lowConfidenceAlert),
        topPrediction.lowConfidenceAlert,
    );
    upsertAlert(alertsMap, "info", topPrediction.speciesData?.dbAlert);

    return Array.from(alertsMap.values()).sort(
        (a, b) => TONE_RANK[b.tone] - TONE_RANK[a.tone],
    );
}
