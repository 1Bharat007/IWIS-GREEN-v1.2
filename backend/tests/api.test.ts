import "dotenv/config";
import request from "supertest";
import app from "../src/app";

describe("IWIS API Integration Tests", () => {
  it("GET /api/health should return 200 OK with system status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body?.status).toBe("ok");
  });

  it("GET /api/auth/me without auth header should return 401 Unauthorized", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/notifications without auth header should return 401 Unauthorized", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });
});
