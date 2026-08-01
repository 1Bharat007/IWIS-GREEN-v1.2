import "dotenv/config";
import request from "supertest";
import app from "../src/app";
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
  });

});
