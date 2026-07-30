/**
 * test-pg-adapter.ts
 *
 * Standalone integration test for db-adapter.ts against a real Postgres instance.
 *
 * Usage:
 *   npx ts-node scripts/test-pg-adapter.ts
 *
 * Requires DATABASE_URL in .env (or environment).
 *
 * Tests:
 *   1. INSERT a row with multiple ? placeholders
 *   2. SELECT (get) the row back — confirm field values match
 *   3. UPDATE — confirm .changes === 1
 *   4. SELECT confirming the update landed in the right column
 *   5. UPDATE a non-existent row — confirm .changes === 0
 *   6. Multi-placeholder correctness: INSERT a row with 5 params, verify
 *      each column received the correct value (not swapped)
 *   7. DELETE — confirm .changes === 1, then SELECT confirms row gone
 */

import "dotenv/config";
import { get, run, all, closePool } from "../src/db-adapter";

const TEST_TABLE = `iwis_pg_adapter_test_${Date.now()}`;

function pass(label: string, detail?: string) {
  console.log(`  ✅ PASS  ${label}${detail ? `  →  ${detail}` : ""}`);
}

function fail(label: string, detail?: string) {
  console.error(`  ❌ FAIL  ${label}${detail ? `  →  ${detail}` : ""}`);
  process.exitCode = 1;
}

async function main() {
  console.log("=======================================================");
  console.log(" IWIS Postgres Adapter — Integration Test Script");
  console.log("=======================================================");
  console.log(`Using DATABASE_URL: ${(process.env.DATABASE_URL || "").replace(/:([^@]+)@/, ":***@")}\n`);

  // ── Setup: create a temporary test table ────────────────────────────────
  console.log("[SETUP] Creating temporary test table...");
  await run(
    `CREATE TABLE IF NOT EXISTS ${TEST_TABLE} (
       id         TEXT PRIMARY KEY,
       label      TEXT,
       score      DOUBLE PRECISION,
       count      INTEGER,
       active     INTEGER DEFAULT 0,
       created_at TEXT
     )`
  );
  console.log(`[SETUP] Table '${TEST_TABLE}' ready.\n`);

  // ── Test 1: INSERT with multiple ? placeholders ──────────────────────────
  console.log("─── Test 1: INSERT with 6 ? placeholders ───────────────");
  const id1 = "test-row-001";
  const insertResult = await run(
    `INSERT INTO ${TEST_TABLE} (id, label, score, count, active, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id1, "alpha", 9.95, 42, 1, "2026-01-01T00:00:00Z"]
  );
  console.log(`  run() returned: { changes: ${insertResult.changes} }`);
  if (insertResult.changes === 1) {
    pass("run() .changes === 1 after INSERT");
  } else {
    fail("run() .changes should be 1 after INSERT", `got ${insertResult.changes}`);
  }

  // ── Test 2: SELECT (get) confirms row came back with correct field values ─
  console.log("\n─── Test 2: get() SELECT by id ─────────────────────────");
  const row1 = await get<any>(
    `SELECT * FROM ${TEST_TABLE} WHERE id = ?`,
    [id1]
  );
  console.log("  get() returned:", row1);

  if (!row1) {
    fail("get() should return the inserted row", "returned undefined");
  } else {
    row1.id === id1          ? pass("row.id correct",         row1.id)         : fail("row.id wrong",        `${row1.id}`);
    row1.label === "alpha"   ? pass("row.label correct",      row1.label)      : fail("row.label wrong",     `${row1.label}`);
    Number(row1.score) === 9.95 ? pass("row.score correct",   String(row1.score)) : fail("row.score wrong",  `${row1.score}`);
    Number(row1.count) === 42   ? pass("row.count correct",   String(row1.count)) : fail("row.count wrong",  `${row1.count}`);
    Number(row1.active) === 1   ? pass("row.active correct",  String(row1.active)) : fail("row.active wrong", `${row1.active}`);
    row1.created_at === "2026-01-01T00:00:00Z"
      ? pass("row.created_at correct", row1.created_at)
      : fail("row.created_at wrong",   row1.created_at);
  }

  // ── Test 3: UPDATE — .changes reflects affected rows ─────────────────────
  console.log("\n─── Test 3: UPDATE (existing row) — .changes === 1 ─────");
  const updateResult = await run(
    `UPDATE ${TEST_TABLE} SET label = ?, score = ? WHERE id = ?`,
    ["beta", 7.77, id1]
  );
  console.log(`  run() returned: { changes: ${updateResult.changes} }`);
  updateResult.changes === 1
    ? pass("run() .changes === 1 after UPDATE of existing row")
    : fail("run() .changes should be 1", `got ${updateResult.changes}`);

  // ── Test 4: SELECT confirms UPDATE landed in correct columns ─────────────
  console.log("\n─── Test 4: get() confirms updated values ───────────────");
  const row2 = await get<any>(
    `SELECT label, score FROM ${TEST_TABLE} WHERE id = ?`,
    [id1]
  );
  console.log("  get() returned:", row2);
  row2?.label === "beta"
    ? pass("label updated to 'beta'", row2.label)
    : fail("label wrong after UPDATE",  `${row2?.label}`);
  Number(row2?.score) === 7.77
    ? pass("score updated to 7.77",    String(row2?.score))
    : fail("score wrong after UPDATE", `${row2?.score}`);

  // ── Test 5: UPDATE non-existent row — .changes === 0 ─────────────────────
  console.log("\n─── Test 5: UPDATE non-existent row — .changes === 0 ───");
  const noOpResult = await run(
    `UPDATE ${TEST_TABLE} SET label = ? WHERE id = ?`,
    ["ghost", "row-does-not-exist-xyz"]
  );
  console.log(`  run() returned: { changes: ${noOpResult.changes} }`);
  noOpResult.changes === 0
    ? pass("run() .changes === 0 for UPDATE with no matching row — listing.controller.ts check works")
    : fail("run() .changes should be 0", `got ${noOpResult.changes}`);

  // ── Test 6: Multi-placeholder ordering — 5 params, verify no swap ────────
  console.log("\n─── Test 6: Multi-placeholder ordering (5 params, no swap) ─");
  const id2 = "test-row-002";
  await run(
    `INSERT INTO ${TEST_TABLE} (id, label, score, count, active) VALUES (?, ?, ?, ?, ?)`,
    [id2, "gamma", 3.14, 99, 0]
  );
  const row3 = await get<any>(
    `SELECT id, label, score, count, active FROM ${TEST_TABLE} WHERE id = ?`,
    [id2]
  );
  console.log("  get() returned:", row3);
  if (!row3) {
    fail("Multi-placeholder INSERT row not found", id2);
  } else {
    // Verify each position maps to the correct column — catches transposition bugs
    row3.id === id2          ? pass("param[0] → id correct",     row3.id)          : fail("param[0] → id SWAPPED",     `${row3.id}`);
    row3.label === "gamma"   ? pass("param[1] → label correct",  row3.label)       : fail("param[1] → label SWAPPED",  `${row3.label}`);
    Number(row3.score) === 3.14 ? pass("param[2] → score correct", String(row3.score)) : fail("param[2] → score SWAPPED", `${row3.score}`);
    Number(row3.count) === 99   ? pass("param[3] → count correct", String(row3.count)) : fail("param[3] → count SWAPPED", `${row3.count}`);
    Number(row3.active) === 0   ? pass("param[4] → active correct", String(row3.active)) : fail("param[4] → active SWAPPED", `${row3.active}`);
  }

  // ── Test 7: all() returns multiple rows ──────────────────────────────────
  console.log("\n─── Test 7: all() returns array of rows ─────────────────");
  const rows = await all<any>(`SELECT id FROM ${TEST_TABLE} ORDER BY id`);
  console.log(`  all() returned ${rows.length} row(s):`, rows.map((r: any) => r.id));
  rows.length === 2
    ? pass("all() returned both rows")
    : fail("all() should return 2 rows", `got ${rows.length}`);

  // ── Test 8: DELETE — .changes === 1, row gone afterward ──────────────────
  console.log("\n─── Test 8: DELETE — .changes === 1, SELECT returns undefined ─");
  const deleteResult1 = await run(
    `DELETE FROM ${TEST_TABLE} WHERE id = ?`,
    [id1]
  );
  console.log(`  run() returned: { changes: ${deleteResult1.changes} }`);
  deleteResult1.changes === 1
    ? pass("run() .changes === 1 after DELETE")
    : fail("run() .changes should be 1", `got ${deleteResult1.changes}`);

  const deletedRow = await get<any>(
    `SELECT * FROM ${TEST_TABLE} WHERE id = ?`,
    [id1]
  );
  deletedRow === undefined
    ? pass("get() returns undefined after DELETE — row is gone")
    : fail("get() should return undefined after DELETE", JSON.stringify(deletedRow));

  // ── Cleanup ──────────────────────────────────────────────────────────────
  console.log("\n[CLEANUP] Dropping temporary test table...");
  await run(`DROP TABLE IF EXISTS ${TEST_TABLE}`);
  console.log("[CLEANUP] Done.");

  console.log("\n=======================================================");
  console.log(" Test run complete. Check for any ❌ FAIL lines above.");
  console.log("=======================================================");
}

main()
  .catch((err) => {
    console.error("\n[FATAL] Test script crashed:", err);
    process.exit(1);
  })
  .finally(() => closePool());
