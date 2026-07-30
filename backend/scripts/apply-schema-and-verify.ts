import "dotenv/config";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // ── Step 2: Apply schema ───────────────────────────────────────────────────
  console.log("=== STEP 2: Applying db-postgres-schema.sql ===");
  const sql = fs.readFileSync(
    path.resolve(__dirname, "../src/db-postgres-schema.sql"),
    "utf8"
  );
  await pool.query(sql);
  console.log("Schema applied successfully.\n");

  // ── Verification: query information_schema ────────────────────────────────
  console.log("=== information_schema.tables — all IWIS tables ===");
  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log("Tables found:", tables.rows.map((r: any) => r.table_name));

  console.log("\n=== information_schema.columns — all columns per table ===");
  const cols = await pool.query(`
    SELECT table_name, column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  let currentTable = "";
  for (const row of cols.rows) {
    if (row.table_name !== currentTable) {
      currentTable = row.table_name;
      console.log(`\n  [${currentTable}]`);
    }
    console.log(
      `    ${row.column_name.padEnd(24)} ${row.data_type.padEnd(20)} default=${row.column_default ?? "NULL"}  nullable=${row.is_nullable}`
    );
  }

  console.log("\n=== information_schema — indexes ===");
  const indexes = await pool.query(`
    SELECT indexname, tablename, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);
  for (const row of indexes.rows) {
    console.log(`  ${row.tablename}.${row.indexname}`);
    console.log(`    ${row.indexdef}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
