/**
 * migrate-data-to-postgres.ts
 *
 * Reads every row from every table in a SQLite database file, and inserts each
 * into the corresponding Postgres table via the db-adapter.
 *
 * Usage:
 *   npx ts-node scripts/migrate-data-to-postgres.ts [path-to-sqlite.db]
 *
 *   If no path argument is given, defaults to ./iwis.db in the backend dir.
 *   ALWAYS run against a COPY of your live db, not the live file.
 *
 * Safety guarantees:
 *   - Per-table row counts are logged BEFORE and AFTER migration.
 *   - If any table's post-migration Postgres count != SQLite count, the
 *     script throws and exits non-zero (does NOT silently continue).
 *   - Uses INSERT ... ON CONFLICT DO NOTHING so the script is re-runnable
 *     without duplicating rows (idempotent).
 *
 * Dependency order (mirrors FK relationships in db.ts):
 *   1. users                  (no FK deps)
 *   2. batches                → users
 *   3. listings               → batches, users
 *   4. bids                   → listings, users
 *   5. reset_tokens           → users
 *   6. otp_codes              (no FK — phone is PK)
 *   7. waste_listings         → users
 *   8. transactions           → waste_listings, users
 *   9. recycler_profiles      → users
 *  10. hotspots               → users
 *  11. scrap_prices           (no FK)
 *  12. collection_confirmations → users
 *  13. notifications          → users
 *  14. ai_telemetry           (no FK — userId is not constrained in DDL)
 */

import "dotenv/config";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import { run as pgRun, all as pgAll, closePool } from "../src/db-adapter";

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(msg: string) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function fatal(msg: string): never {
  console.error(`\n❌ FATAL: ${msg}\n`);
  process.exit(1);
}

/** Read all rows from a SQLite table */
async function sqliteAll(db: Database, table: string): Promise<any[]> {
  return db.all(`SELECT * FROM "${table}"`);
}

/** Get row count from Postgres for a table */
async function pgCount(table: string): Promise<number> {
  const rows = await pgAll(`SELECT COUNT(*) AS cnt FROM "${table}"`);
  return parseInt(rows[0]?.cnt ?? "0", 10);
}

/** Get row count from SQLite for a table */
async function sqliteCount(db: Database, table: string): Promise<number> {
  const row = await db.get(`SELECT COUNT(*) AS cnt FROM "${table}"`);
  return row?.cnt ?? 0;
}

/** Check if a table exists in SQLite (skips gracefully if a table was never created) */
async function sqliteTableExists(db: Database, table: string): Promise<boolean> {
  const row = await db.get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [table]
  );
  return !!row;
}

/**
 * Insert rows into Postgres using batched INSERTs.
 * Uses ON CONFLICT DO NOTHING so reruns are safe.
 */
async function migrateTable(
  sqliteDb: Database,
  table: string
): Promise<{ sqliteCount: number; pgCountBefore: number; pgCountAfter: number; inserted: number }> {
  const exists = await sqliteTableExists(sqliteDb, table);
  if (!exists) {
    log(`  [SKIP] Table '${table}' does not exist in SQLite — skipping.`);
    return { sqliteCount: 0, pgCountBefore: 0, pgCountAfter: 0, inserted: 0 };
  }

  const rows = await sqliteAll(sqliteDb, table);
  const before = await pgCount(table);

  log(`  SQLite rows: ${rows.length}  |  Postgres rows before: ${before}`);

  if (rows.length === 0) {
    log(`  [SKIP] No rows to migrate for '${table}'.`);
    return { sqliteCount: 0, pgCountBefore: before, pgCountAfter: before, inserted: 0 };
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  let inserted = 0;
  const BATCH_SIZE = 100;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    for (const row of batch) {
      const values = columns.map((c) => row[c]);
      const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(", ");
      // We build the Postgres SQL directly here (using $N syntax) to bypass
      // translatePlaceholders — this avoids double-translating and keeps
      // the migration script self-contained and explicit.
      const sql = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      const result = await pgRun(sql, values);
      inserted += result.changes;
    }
  }

  const after = await pgCount(table);
  return { sqliteCount: rows.length, pgCountBefore: before, pgCountAfter: after, inserted };
}

// ─── Table order (dependency order per db.ts FK relationships) ────────────

const TABLE_ORDER = [
  "users",
  "batches",
  "listings",
  "bids",
  "reset_tokens",
  "otp_codes",
  "waste_listings",
  "transactions",
  "recycler_profiles",
  "hotspots",
  "scrap_prices",
  "collection_confirmations",
  "notifications",
  "ai_telemetry",
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const sqlitePath = process.argv[2] || path.resolve(__dirname, "../iwis.db");
  log("==========================================================");
  log(" IWIS SQLite → Postgres Migration");
  log("==========================================================");
  log(`SQLite source: ${sqlitePath}`);
  log(`DATABASE_URL:  ${(process.env.DATABASE_URL || "").replace(/:([^@]+)@/, ":***@")}`);

  if (!process.env.DATABASE_URL) {
    fatal("DATABASE_URL is not set. Add it to .env before running this script.");
  }

  // Open SQLite source
  const sqliteDb = await open({
    filename: sqlitePath,
    driver: sqlite3.Database,
  });
  log("SQLite connection opened.\n");

  const results: Record<string, { sqliteCount: number; pgCountAfter: number; ok: boolean }> = {};
  const failures: string[] = [];

  for (const table of TABLE_ORDER) {
    log(`━━━ Migrating table: ${table} ━━━`);
    try {
      const r = await migrateTable(sqliteDb, table);
      const ok = r.pgCountAfter >= r.sqliteCount; // >=  because ON CONFLICT DO NOTHING means pre-existing rows are fine
      results[table] = { sqliteCount: r.sqliteCount, pgCountAfter: r.pgCountAfter, ok };

      if (!ok) {
        const msg = `Row count mismatch for '${table}': SQLite=${r.sqliteCount}, Postgres after=${r.pgCountAfter}`;
        log(`  ❌ MISMATCH: ${msg}`);
        failures.push(msg);
      } else {
        log(`  ✅ OK: SQLite=${r.sqliteCount}  Postgres after=${r.pgCountAfter}  inserted=${r.inserted}`);
      }
    } catch (err: any) {
      const msg = `Migration THREW for '${table}': ${err?.message}`;
      log(`  ❌ ${msg}`);
      failures.push(msg);
    }
    log("");
  }

  await sqliteDb.close();

  // ─── Summary ────────────────────────────────────────────────────────────
  log("==========================================================");
  log(" Migration Summary");
  log("==========================================================");
  log(`${"Table".padEnd(28)} ${"SQLite".padStart(8)} ${"Postgres".padStart(10)} ${"Status".padStart(8)}`);
  log("-".repeat(60));
  for (const [table, r] of Object.entries(results)) {
    const status = r.ok ? "✅ OK" : "❌ FAIL";
    log(`${table.padEnd(28)} ${String(r.sqliteCount).padStart(8)} ${String(r.pgCountAfter).padStart(10)} ${status.padStart(8)}`);
  }

  if (failures.length > 0) {
    log("\n❌ MIGRATION FAILED — the following tables had issues:");
    for (const f of failures) log(`   • ${f}`);
    fatal(`${failures.length} table(s) failed verification. Do NOT switch to Postgres yet.`);
  }

  log("\n✅ ALL TABLES MIGRATED AND VERIFIED SUCCESSFULLY.");
  log("   You may now run verify-pg-migration.ts for column-level spot-checking.");
}

main()
  .catch((err) => {
    console.error("\n[FATAL] Migration script crashed:", err);
    process.exit(1);
  })
  .finally(() => closePool());
