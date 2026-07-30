/**
 * db-adapter.ts
 *
 * A Postgres adapter that exposes the same `get`, `run`, and `all` function
 * signatures as the sqlite-backed db.ts — so controllers can be switched over
 * one-by-one without changing their call sites.
 *
 * NOT wired into any controller in this stage (additive groundwork only).
 */

import { Pool, PoolConfig, QueryResult } from "pg";

// ─── Connection Pool ────────────────────────────────────────────────────────

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "[db-adapter] DATABASE_URL environment variable is not set. " +
          "Add it to your .env file to use the Postgres adapter."
      );
    }
    const config: PoolConfig = {
      connectionString: process.env.DATABASE_URL,
      // Sensible pool defaults; tunable via env later
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    };
    pool = new Pool(config);
  }
  return pool;
}

// ─── Placeholder Translation ────────────────────────────────────────────────
//
// SQLite uses `?` positional placeholders. Postgres uses `$1`, `$2`, ... 
// This is the single riskiest piece of the migration: an off-by-one here
// silently sends wrong values to wrong columns.
//
// Strategy: scan the SQL string left-to-right; each `?` that is NOT inside
// a string literal gets replaced with the next `$n`. String literals are
// single-quoted in SQL; we handle escaped single-quotes ('') correctly.
//
// We intentionally do NOT handle `?` inside double-quoted identifiers because
// SQLite uses double-quotes for strings in some dialects, but our codebase
// consistently uses single-quotes for string literals and double-quotes only
// for identifiers (which would never contain `?`).

export function translatePlaceholders(sql: string): string {
  let result = "";
  let paramIndex = 1;
  let inString = false;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    if (inString) {
      if (ch === "'") {
        // Could be end-of-string or escaped quote ('')
        if (sql[i + 1] === "'") {
          // Escaped single quote — output both and skip two chars
          result += "''";
          i += 2;
          continue;
        } else {
          inString = false;
          result += ch;
        }
      } else {
        result += ch;
      }
    } else {
      if (ch === "'") {
        inString = true;
        result += ch;
      } else if (ch === "?") {
        result += `$${paramIndex++}`;
      } else {
        result += ch;
      }
    }
    i++;
  }

  return result;
}

// ─── Result Types ────────────────────────────────────────────────────────────

/** Mirrors the sqlite `run()` result — controllers use `.changes` */
export interface RunResult {
  changes: number;
}

// ─── Adapter Functions ───────────────────────────────────────────────────────

/**
 * get(sql, params?) — returns the first matching row, or undefined.
 * Mirrors sqlite's `db.get(sql, params)` signature.
 */
export async function get<T = any>(
  sql: string,
  params?: any[]
): Promise<T | undefined> {
  const pgSql = translatePlaceholders(sql);
  const client = getPool();
  const result: QueryResult = await client.query(pgSql, params);
  return result.rows[0] as T | undefined;
}

/**
 * run(sql, params?) — executes a write statement, returns { changes }.
 * Mirrors sqlite's `db.run(sql, params)` — specifically `.changes` maps to
 * `rowCount` so listing.controller.ts's `result.changes === 0` still works.
 */
export async function run(
  sql: string,
  params?: any[]
): Promise<RunResult> {
  const pgSql = translatePlaceholders(sql);
  const client = getPool();
  const result: QueryResult = await client.query(pgSql, params);
  return { changes: result.rowCount ?? 0 };
}

/**
 * all(sql, params?) — returns all matching rows as an array.
 * Mirrors sqlite's `db.all(sql, params)` signature.
 */
export async function all<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const pgSql = translatePlaceholders(sql);
  const client = getPool();
  const result: QueryResult = await client.query(pgSql, params);
  return result.rows as T[];
}

/**
 * closePool() — gracefully closes the connection pool.
 * Useful in tests and graceful shutdown handlers.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
