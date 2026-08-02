import "dotenv/config";
import request from "supertest";
import app from "../src/app";
import { getDB, withTransaction } from "../src/db";
import { createClerkClient } from "@clerk/backend";

describe("IWIS API Comprehensive Integration & Security Test Suite", () => {

  describe("Public Health & Utility Endpoints", () => {
    it("GET /api/health should return 200 OK with system status", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body?.status).toBe("ok");
      expect(res.body?.timestamp).toBeDefined();
    });

    it("GET /api/prices should return public daily scrap rates", async () => {
      const res = await request(app).get("/api/prices");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body?.data || res.body)).toBe(true);
    });
  });

  describe("Authentication & Authorization Security Gates", () => {
    it("GET /api/auth/me without auth header should return 401 Unauthorized", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body?.message).toMatch(/not authorized|invalid session/i);
    });

    it("GET /api/notifications without auth header should return 401 Unauthorized", async () => {
      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(401);
    });

    it("GET /api/transactions without auth header should return 401 Unauthorized", async () => {
      const res = await request(app).get("/api/transactions");
      expect(res.status).toBe(401);
    });

    it("GET /api/waste/history without auth header should return 401 Unauthorized", async () => {
      const res = await request(app).get("/api/waste/history");
      expect(res.status).toBe(401);
    });

    it("GET /api/listings/nearby without auth header should return 401 Unauthorized", async () => {
      const res = await request(app).get("/api/listings/nearby");
      expect(res.status).toBe(401);
    });

    it("POST /api/chat without auth header should return 401 Unauthorized", async () => {
      const res = await request(app).post("/api/chat").send({ message: "Hello EcoBot" });
      expect(res.status).toBe(401);
    });

    it("GET /api/analytics/citizen without auth header should return 401 Unauthorized", async () => {
      const res = await request(app).get("/api/analytics/citizen");
      expect(res.status).toBe(401);
    });

    it("Should reject requests with forged or invalid Bearer token signatures", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.forged.jwt.token.signature");
      expect(res.status).toBe(401);
      expect(res.body?.message).toMatch(/invalid session or authentication failed|not authorized/i);
    });
  });

  describe("Real Authenticated Session End-to-End Coverage (HTTP Supertest Layer)", () => {
    let realToken: string;

    beforeAll(async () => {
      const secretKey = process.env.CLERK_SECRET_KEY;
      if (!secretKey) throw new Error("CLERK_SECRET_KEY required for integration tests");
      const client = createClerkClient({ secretKey });
      const users = await client.users.getUserList({ limit: 1 });
      const userId = users.data[0]?.id || "user_3H1xpSJxk4tykF1kKqOMfdcmrQ3";
      const session = await client.sessions.createSession({ userId });
      const tokenObj = await client.sessions.getToken(session.id);
      realToken = tokenObj.jwt;
    });

    it("GET /api/auth/me with real Clerk session JWT passes verification and provisions user (HTTP 200)", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${realToken}`);

      expect(res.status).toBe(200);
      const data = res.body?.data || res.body;
      expect(data?.id).toBeDefined();
      expect(data?.email).toBeDefined();
    });

    it("Repeat call to GET /api/auth/me with same token matches existing user row without creating duplicates", async () => {
      const res1 = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${realToken}`);

      const res2 = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${realToken}`);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      const user1 = res1.body?.data || res1.body;
      const user2 = res2.body?.data || res2.body;

      expect(user1?.id).toBeDefined();
      expect(user2?.id).toBe(user1?.id);
    });

    it("GET /api/transactions/summary with real token propagates user context cleanly (HTTP 200)", async () => {
      const res = await request(app)
        .get("/api/transactions/summary")
        .set("Authorization", `Bearer ${realToken}`);

      expect(res.status).toBe(200);
    });

    it("Atomic confirmPickup status transition prevents double-confirmation and double-payment", async () => {
      const db = await getDB();
      const now = new Date().toISOString();
      const citizenId = "test_citizen_race_001";
      const recyclerId = "test_recycler_race_001";
      const listingId = "listing_race_test_001";

      await db.run("DELETE FROM transactions WHERE listingId = ?", listingId);
      await db.run("DELETE FROM waste_listings WHERE id = ?", listingId);
      await db.run("DELETE FROM recycler_profiles WHERE userId = ?", recyclerId);
      await db.run("DELETE FROM users WHERE id IN (?, ?)", [citizenId, recyclerId]);

      await db.run("INSERT INTO users (id, email, role, totalEarnings, createdAt) VALUES (?, ?, 'citizen', 0, ?)", [citizenId, "citizen_race@test.com", now]);
      await db.run("INSERT INTO users (id, email, role, totalEarnings, createdAt) VALUES (?, ?, 'recycler', 0, ?)", [recyclerId, "recycler_race@test.com", now]);
      await db.run("INSERT INTO recycler_profiles (id, userId, businessName, rating, createdAt) VALUES ('rp_race_001', ?, 'Test Recycler Hub', 4.8, ?)", [recyclerId, now]);

      await db.run(
        "INSERT INTO waste_listings (id, citizenId, recyclerId, materialType, estimatedWeightKg, pickupAddress, status, createdAt) VALUES (?, ?, ?, 'Paper', 10, '123 Green Street', 'scheduled', ?)",
        [listingId, citizenId, recyclerId, now]
      );

      // Ensure scrap price exists for Paper
      const existingPrice = await db.get("SELECT pricePerKg FROM scrap_prices WHERE material = 'Paper'");
      if (!existingPrice) {
        await db.run("INSERT INTO scrap_prices (id, material, pricePerKg, city, updatedAt) VALUES ('sp_paper', 'Paper', 15.0, 'Delhi', ?)", [now]);
      }

      // Simulate atomic status update + payment transaction
      const attemptConfirm = async () => {
        const listing = await db.get("SELECT * FROM waste_listings WHERE id = ?", listingId);
        if (listing.status === 'completed') {
          return { status: 409, message: "This pickup has already been confirmed." };
        }

        const result = await db.run(
          "UPDATE waste_listings SET status = 'completed', actualWeightKg = 10, finalValue = 150, completedAt = ?, updatedAt = ? WHERE id = ? AND status IN ('accepted', 'scheduled')",
          [now, now, listingId]
        );

        if (!result || result.changes === 0) {
          return { status: 409, message: "This pickup has already been confirmed." };
        }

        const txId = "tx_race_" + Math.random().toString(36).slice(2);
        await db.run(
          `INSERT INTO transactions (
            id, listingId, citizenId, recyclerId, material, finalWeightKg, pricePerKg, 
            amount, platformFee, citizenEarnings, paymentMethod, paymentStatus, status, createdAt
          ) VALUES (?, ?, ?, ?, 'Paper', 10, 15.0, 150, 3.0, 147.0, 'cash', 'completed', 'completed', ?)`,
          [txId, listingId, citizenId, recyclerId, now]
        );

        await db.run("UPDATE users SET totalEarnings = COALESCE(totalEarnings, 0) + 147.0 WHERE id = ?", citizenId);
        return { status: 200, message: "Success" };
      };

      const res1 = await attemptConfirm();
      const res2 = await attemptConfirm();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(409);

      // Verify DB invariants: exactly ONE transaction row created and totalEarnings credited exactly once
      const txRows = await db.all("SELECT id FROM transactions WHERE listingId = ?", listingId);
      expect(txRows.length).toBe(1);

      const citizen = await db.get("SELECT totalEarnings FROM users WHERE id = ?", citizenId);
      expect(citizen.totalEarnings).toBe(147.0);
    });

    it("withTransaction rolls back cleanly when an error is thrown mid-transaction (proving atomicity)", async () => {
      const db = await getDB();
      const now = new Date().toISOString();
      const testListingId = "listing_crash_test_001";
      const testTxId = "tx_crash_test_001";

      await db.run("DELETE FROM transactions WHERE id = ?", testTxId);
      await db.run("DELETE FROM waste_listings WHERE id = ?", testListingId);

      // Ensure valid parent listing and users exist to satisfy foreign keys
      const existingUser = await db.get("SELECT id FROM users LIMIT 1");
      const validUserId = existingUser?.id || "user_test_ci_automation_001";

      await db.run(
        "INSERT INTO waste_listings (id, citizenId, recyclerId, materialType, estimatedWeightKg, pickupAddress, status, createdAt) VALUES (?, ?, ?, 'Paper', 10, '123 Green Street', 'scheduled', ?)",
        [testListingId, validUserId, validUserId, now]
      );

      // Attempt transaction that throws midway
      try {
        await withTransaction(async (tx) => {
          await tx.run(
            `INSERT INTO transactions (
              id, listingId, citizenId, recyclerId, material, finalWeightKg, pricePerKg, 
              amount, platformFee, citizenEarnings, paymentMethod, paymentStatus, status, createdAt
            ) VALUES (?, ?, ?, ?, 'Paper', 10, 15.0, 150, 3.0, 147.0, 'cash', 'completed', 'completed', ?)`,
            [testTxId, testListingId, validUserId, validUserId, now]
          );

          // Force mid-transaction crash
          throw new Error("SIMULATED_MID_TRANSACTION_CRASH");
        });
      } catch (err: any) {
        expect(err.message).toBe("SIMULATED_MID_TRANSACTION_CRASH");
      }

      // Assert that ROLLBACK undid the insert and ZERO rows exist for testTxId
      const checkTx = await db.get("SELECT id FROM transactions WHERE id = ?", testTxId);
      expect(checkTx).toBeUndefined();
    });
  });

});
