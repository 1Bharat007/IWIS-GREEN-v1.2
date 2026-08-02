/**
 * Unit tests for translatePlaceholders() in db-adapter.ts
 *
 * Run with: npx jest tests/db-adapter.test.ts
 *
 * This is the single highest-risk piece of the Postgres migration:
 * an off-by-one in placeholder translation sends wrong values to wrong
 * columns with no type error at the call site.
 */

import { translatePlaceholders } from "../src/db-adapter";

describe("translatePlaceholders", () => {
  // ── Basic cases ──────────────────────────────────────────────────────────

  test("no placeholders — SQL unchanged", () => {
    const sql = "SELECT * FROM users";
    expect(translatePlaceholders(sql)).toBe("SELECT * FROM users");
  });

  test("single ? replaced with $1", () => {
    const sql = "SELECT * FROM users WHERE id = ?";
    expect(translatePlaceholders(sql)).toBe("SELECT * FROM users WHERE id = $1");
  });

  test("two ? replaced in order: $1, $2", () => {
    const sql = "UPDATE users SET name = ? WHERE id = ?";
    expect(translatePlaceholders(sql)).toBe(
      "UPDATE users SET name = $1 WHERE id = $2"
    );
  });

  test("three ? in INSERT are correctly numbered $1, $2, $3", () => {
    const sql = "INSERT INTO users (id, email, role) VALUES (?, ?, ?)";
    expect(translatePlaceholders(sql)).toBe(
      "INSERT INTO users (id, email, role) VALUES ($1, $2, $3)"
    );
  });

  test("eight ? in scrap_prices INSERT — correct order $1..$8", () => {
    // Mirrors the seed INSERT in db.ts exactly
    const sql =
      "INSERT INTO scrap_prices (id, material, city, pricePerKg, source, effectiveDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    expect(translatePlaceholders(sql)).toBe(
      "INSERT INTO scrap_prices (id, material, city, pricePerKg, source, effectiveDate, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
    );
  });

  // ── String-literal protection ────────────────────────────────────────────
  // A `?` inside a string literal must NOT be translated — it is data, not
  // a placeholder. This is the subtle correctness requirement.

  test("? inside single-quoted string literal is NOT translated", () => {
    const sql = "SELECT * FROM items WHERE description = 'contains? a question mark'";
    expect(translatePlaceholders(sql)).toBe(
      "SELECT * FROM items WHERE description = 'contains? a question mark'"
    );
  });

  test("? outside vs inside string — only outside ? is translated", () => {
    const sql = "UPDATE t SET note = 'what?' WHERE id = ?";
    expect(translatePlaceholders(sql)).toBe(
      "UPDATE t SET note = 'what?' WHERE id = $1"
    );
  });

  test("escaped single-quote '' inside string is handled — ? after string translated", () => {
    // 'it''s a test' is an escaped single quote in SQL — remains a single string literal
    const sql = "SELECT * FROM t WHERE label = 'it''s a test' AND id = ?";
    expect(translatePlaceholders(sql)).toBe(
      "SELECT * FROM t WHERE label = 'it''s a test' AND id = $1"
    );
  });

  test("multiple ? outside strings, one string with ? inside", () => {
    const sql = "INSERT INTO t (a, b, c) VALUES (?, 'raw?literal', ?) WHERE id = ?";
    expect(translatePlaceholders(sql)).toBe(
      "INSERT INTO t (a, b, c) VALUES ($1, 'raw?literal', $2) WHERE id = $3"
    );
  });

  // ── Real SQL from listing.controller.ts ──────────────────────────────────

  test("listing controller UPDATE — three ? in correct order", () => {
    const sql =
      "UPDATE waste_listings SET status = 'accepted', recyclerId = ?, updatedAt = ? WHERE id = ? AND status = 'listed'";
    expect(translatePlaceholders(sql)).toBe(
      "UPDATE waste_listings SET status = 'accepted', recyclerId = $1, updatedAt = $2 WHERE id = $3 AND status = 'listed'"
    );
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  test("empty string returns empty string", () => {
    expect(translatePlaceholders("")).toBe("");
  });

  test("SQL with only string literals containing ? — none translated", () => {
    const sql = "SELECT 'is it done?' AS q FROM dual";
    expect(translatePlaceholders(sql)).toBe("SELECT 'is it done?' AS q FROM dual");
  });

  test("adjacent ? ? produces $1 $2 with correct spacing", () => {
    const sql = "SELECT ?, ?";
    expect(translatePlaceholders(sql)).toBe("SELECT $1, $2");
  });

  test("string ending exactly on last char — no crash", () => {
    const sql = "SELECT * FROM t WHERE id = ?";
    expect(translatePlaceholders(sql)).toBe("SELECT * FROM t WHERE id = $1");
  });
});

describe("withTransaction adapter structure", () => {
  test("withTransaction function is exported with correct signature", () => {
    const { withTransaction } = require("../src/db-adapter");
    expect(typeof withTransaction).toBe("function");
  });
});
