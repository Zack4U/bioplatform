/**
 * SQLite database — local persistence for the offline-first layer.
 *
 * Single shared connection (expo-sqlite async API). The schema is created on
 * first access. Tables:
 * - species_cache         catalog list + full detail (detail_json) write-through cache
 * - species_image_cache   gallery images per species
 * - pending_observations  upload queue for contributions made while offline
 * - sync_meta             key/value metadata (last sync, etc.)
 *
 * @module lib/db/database
 */

import * as SQLite from "expo-sqlite";

const DB_NAME = "biocommerce.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS species_cache (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT,
  scientific_name TEXT,
  common_name TEXT,
  thumbnail_url TEXT,
  thumb_local_uri TEXT,
  conservation_status TEXT,
  is_sensitive INTEGER DEFAULT 0,
  kingdom TEXT,
  family TEXT,
  detail_json TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS species_image_cache (
  id TEXT PRIMARY KEY NOT NULL,
  species_id TEXT NOT NULL,
  image_url TEXT,
  thumbnail_url TEXT,
  local_uri TEXT,
  is_primary INTEGER DEFAULT 0,
  is_validated INTEGER DEFAULT 0,
  license_type TEXT,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_image_species ON species_image_cache(species_id);

CREATE TABLE IF NOT EXISTS pending_observations (
  id TEXT PRIMARY KEY NOT NULL,
  species_id TEXT NOT NULL,
  image_uri TEXT NOT NULL,
  mime_type TEXT,
  license_type TEXT,
  latitude REAL,
  longitude REAL,
  species_predicted TEXT,
  confidence_score REAL,
  model_version TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);
`;

/** Idempotent column additions for databases created before a column existed. */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
    const alters = [
        "ALTER TABLE species_cache ADD COLUMN thumb_local_uri TEXT",
        "ALTER TABLE species_image_cache ADD COLUMN local_uri TEXT",
    ];
    for (const sql of alters) {
        try {
            await db.execAsync(sql);
        } catch {
            // Column already exists — ignore.
        }
    }
}

/** Get (and lazily open + migrate) the shared SQLite connection. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!dbPromise) {
        dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
            await db.execAsync(SCHEMA);
            await runMigrations(db);
            return db;
        });
    }
    return dbPromise;
}

// ─── sync_meta key/value helpers ───────────────────────────────────────────────

export async function getMeta(key: string): Promise<string | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM sync_meta WHERE key = ?",
        key,
    );
    return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `INSERT INTO sync_meta (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        key,
        value,
    );
}
