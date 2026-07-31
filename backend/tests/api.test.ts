import "dotenv/config";
import request from "supertest";
import app from "../src/app";

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

});
