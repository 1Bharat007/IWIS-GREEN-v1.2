/**
 * verify-pg-migration.ts
 *
 * Column-level spot-check: for every table, samples up to 10 rows randomly
 * from SQLite and verifies that the exact same row (every column value) exists
 * in Postgres. For tables with fewer than 10 rows, checks ALL rows.
 *
 * Usage:
 *   npx ts-node scripts/verify-pg-migration.ts [path-to-sqlite.db]
 *
 * Exits non-zero if any mismatch is found.
 */

import "dotenv/config";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import { get as pgGet, all as pgAll, closePool } from "../src/db-adapter";

function log(msg: string) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

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

// Maps each table to its primary key column name (as defined in db.ts)
const PRIMARY_KEYS: Record<string, string> = {
  users: "id",
  batches: "id",
  listings: "id",
  bids: "id",
  reset_tokens: "token",
  otp_codes: "phone",
  waste_listings: "id",
  transactions: "id",
  recycler_profiles: "id",
  hotspots: "id",
  scrap_prices: "id",
  collection_confirmations: "id",
  notifications: "id",
  ai_telemetry: "id",
};

/** Normalise a cell value for comparison.
 * SQLite returns numbers as JS number; Postgres may return strings for
 * DOUBLE PRECISION/INTEGER from the pg driver. We normalise both sides to
 * strings for comparison, with null/undefined both mapping to "NULL".
 */
function normalise(v: any): string {
  if (v === null || v === undefined) return "NULL";
  return String(v).trim();
}

/** Compare two rows field by field. Returns list of mismatched columns. */
function diffRows(sqlite: any, pg: any, columns: string[]): string[] {
  return columns.filter((col) => normalise(sqlite[col]) !== normalise(pg[col]));
}

async function sqliteTableExists(db: Database, table: string): Promise<boolean> {
  const row = await db.get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [table]
  );
  return !!row;
}

async function verifyTable(
  sqliteDb: Database,
  table: string
): Promise<{ checked: number; mismatches: number }> {
  const exists = await sqliteTableExists(sqliteDb, table);
  if (!exists) {
    log(`  [SKIP] '${table}' not in SQLite.`);
    return { checked: 0, mismatches: 0 };
  }

  const pk = PRIMARY_KEYS[table];
  const allSqliteRows: any[] = await sqliteDb.all(`SELECT * FROM "${table}"`);

  if (allSqliteRows.length === 0) {
    log(`  [SKIP] '${table}' has 0 rows.`);
    return { checked: 0, mismatches: 0 };
  }

  // Sample: all rows if <= 10, otherwise 10 random rows
  let sample: any[];
  if (allSqliteRows.length <= 10) {
    sample = allSqliteRows;
    log(`  Checking ALL ${allSqliteRows.length} row(s) (table has ≤10 rows).`);
  } else {
    // Fisher-Yates partial shuffle to pick 10 random rows without replacement
    const arr = [...allSqliteRows];
    for (let i = arr.length - 1; i > arr.length - 11; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    sample = arr.slice(arr.length - 10);
    log(`  Sampling 10 random rows from ${allSqliteRows.length} total.`);
  }

  const columns = Object.keys(allSqliteRows[0]);
  let mismatches = 0;

  for (const sqliteRow of sample) {
    const pkVal = sqliteRow[pk];
    // Fetch the matching Postgres row by PK
    const pgRow = await pgGet(
      `SELECT * FROM "${table}" WHERE "${pk}" = $1`,
      [pkVal]
    );

    if (!pgRow) {
      log(`  ❌ MISSING in Postgres: ${table}.${pk} = ${pkVal}`);
      mismatches++;
      continue;
    }

    const diffs = diffRows(sqliteRow, pgRow, columns);
    if (diffs.length > 0) {
      log(`  ❌ COLUMN MISMATCH for ${table}.${pk} = ${pkVal}:`);
      for (const col of diffs) {
        log(`     Column '${col}': SQLite=${normalise(sqliteRow[col])}  Postgres=${normalise(pgRow[col])}`);
      }
      mismatches++;
    } else {
      log(`  ✅ ${table}.${pk} = ${pkVal}  →  all ${columns.length} columns match`);
    }
  }

  return { checked: sample.length, mismatches };
}

async function main() {
  const sqlitePath = process.argv[2] || path.resolve(__dirname, "../iwis.db");
  log("==========================================================");
  log(" IWIS Postgres Migration — Column-Level Verification");
  log("==========================================================");
  log(`SQLite source: ${sqlitePath}`);
  log(`DATABASE_URL:  ${(process.env.DATABASE_URL || "").replace(/:([^@]+)@/, ":***@")}`);

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set.");
    process.exit(1);
  }

  const sqliteDb = await open({ filename: sqlitePath, driver: sqlite3.Database });
  log("SQLite connection opened.\n");

  const summary: Record<string, { checked: number; mismatches: number }> = {};
  let totalMismatches = 0;

  for (const table of TABLE_ORDER) {
    log(`━━━ Verifying: ${table} ━━━`);
    try {
      const result = await verifyTable(sqliteDb, table);
      summary[table] = result;
      totalMismatches += result.mismatches;
    } catch (err: any) {
      log(`  ❌ ERROR: ${err?.message}`);
      summary[table] = { checked: 0, mismatches: 1 };
      totalMismatches++;
    }
    log("");
  }

  await sqliteDb.close();

  log("==========================================================");
  log(" Verification Summary");
  log("==========================================================");
  log(`${"Table".padEnd(28)} ${"Checked".padStart(9)} ${"Mismatches".padStart(12)} ${"Status".padStart(8)}`);
  log("-".repeat(64));
  for (const [table, r] of Object.entries(summary)) {
    const status = r.mismatches === 0 ? "✅ OK" : "❌ FAIL";
    log(
      `${table.padEnd(28)} ${String(r.checked).padStart(9)} ${String(r.mismatches).padStart(12)} ${status.padStart(8)}`
    );
  }

  if (totalMismatches > 0) {
    log(`\n❌ VERIFICATION FAILED — ${totalMismatches} mismatch(es) found. Do NOT switch to Postgres.`);
    process.exit(1);
  }

  log("\n✅ ALL SAMPLED ROWS VERIFIED — every column matches between SQLite and Postgres.");
  log("   Ready for Stage 3 cutover.");
}

main()
  .catch((err) => {
    console.error("[FATAL] Verification script crashed:", err);
    process.exit(1);
  })
  .finally(() => closePool());
