/**
 * Observation queue repository — durable store for contributions made offline.
 *
 * When the user contributes an observation without connectivity, it is enqueued
 * here and flushed to the backend by the sync service once online.
 *
 * @module lib/db/observation-queue
 */

import { getDb } from "@/lib/db/database";

export interface PendingObservation {
    id: string;
    speciesId: string;
    imageUri: string;
    mimeType: string;
    licenseType: string;
    latitude: number | null;
    longitude: number | null;
    speciesPredicted: string | null;
    confidenceScore: number | null;
    modelVersion: string | null;
    createdAt: string;
}

export type NewObservation = Omit<PendingObservation, "id" | "createdAt">;

interface ObservationRow {
    id: string;
    species_id: string;
    image_uri: string;
    mime_type: string | null;
    license_type: string | null;
    latitude: number | null;
    longitude: number | null;
    species_predicted: string | null;
    confidence_score: number | null;
    model_version: string | null;
    created_at: string | null;
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Persist a new observation to the upload queue. Returns the generated id. */
export async function enqueueObservation(
    obs: NewObservation,
): Promise<string> {
    const db = await getDb();
    const id = generateId();
    const createdAt = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO pending_observations
         (id, species_id, image_uri, mime_type, license_type, latitude, longitude,
          species_predicted, confidence_score, model_version, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        obs.speciesId,
        obs.imageUri,
        obs.mimeType,
        obs.licenseType,
        obs.latitude,
        obs.longitude,
        obs.speciesPredicted,
        obs.confidenceScore,
        obs.modelVersion,
        createdAt,
    );

    return id;
}

export async function getPendingObservations(): Promise<PendingObservation[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ObservationRow>(
        "SELECT * FROM pending_observations ORDER BY created_at ASC",
    );
    return rows.map((row) => ({
        id: row.id,
        speciesId: row.species_id,
        imageUri: row.image_uri,
        mimeType: row.mime_type ?? "image/jpeg",
        licenseType: row.license_type ?? "CC-BY",
        latitude: row.latitude,
        longitude: row.longitude,
        speciesPredicted: row.species_predicted,
        confidenceScore: row.confidence_score,
        modelVersion: row.model_version,
        createdAt: row.created_at ?? new Date().toISOString(),
    }));
}

export async function removeObservation(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync("DELETE FROM pending_observations WHERE id = ?", id);
}

export async function countPendingObservations(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM pending_observations",
    );
    return row?.count ?? 0;
}
