/**
 * db-adapter.ts
 *
 * A Postgres adapter that exposes the same `get`, `run`, and `all` function
 * signatures as the sqlite-backed db.ts — so controllers can be switched over
 * one-by-one without changing their call sites.
 *
 * Provides real connection-pinned transaction support via `withTransaction`.
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
    // Enable SSL for all remote connections (Render, Supabase, etc.)
    // Skip SSL only when explicitly connecting to localhost for local dev
    const isLocal =
      process.env.DATABASE_URL.includes("localhost") ||
      process.env.DATABASE_URL.includes("127.0.0.1");

    const config: PoolConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      // Sensible pool defaults; tunable via env later
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    };
    pool = new Pool(config);
  }
  return pool;
}

// ─── Placeholder Translation ────────────────────────────────────────────────

export function translatePlaceholders(sql: string): string {
  let result = "";
  let paramIndex = 1;
  let inString = false;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    if (inString) {
      if (ch === "'") {
        if (sql[i + 1] === "'") {
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
 * withTransaction<T>(callback) — Pins a single PoolClient, runs BEGIN,
 * passes a bound { get, run, all } interface executing on that pinned client,
 * COMMITs on success, ROLLBACKs on error, and ALWAYS releases the client in finally block.
 */
export async function withTransaction<T>(
  callback: (client: {
    get: <U = any>(sql: string, params?: any[]) => Promise<U | undefined>;
    run: (sql: string, params?: any[]) => Promise<RunResult>;
    all: <U = any>(sql: string, params?: any[]) => Promise<U[]>;
  }) => Promise<T>
): Promise<T> {
  const poolClient = await getPool().connect();
  try {
    await poolClient.query("BEGIN");

    const boundTx = {
      get: async <U = any>(sql: string, params?: any[]): Promise<U | undefined> => {
        const pgSql = translatePlaceholders(sql);
        const res = await poolClient.query(pgSql, params);
        return res.rows[0] as U | undefined;
      },
      run: async (sql: string, params?: any[]): Promise<RunResult> => {
        const pgSql = translatePlaceholders(sql);
        const res = await poolClient.query(pgSql, params);
        return { changes: res.rowCount ?? 0 };
      },
      all: async <U = any>(sql: string, params?: any[]): Promise<U[]> => {
        const pgSql = translatePlaceholders(sql);
        const res = await poolClient.query(pgSql, params);
        return res.rows as U[];
      },
    };

    const result = await callback(boundTx);
    await poolClient.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await poolClient.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("[db-adapter] Transaction ROLLBACK failed:", rollbackErr);
    }
    throw err;
  } finally {
    poolClient.release();
  }
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
