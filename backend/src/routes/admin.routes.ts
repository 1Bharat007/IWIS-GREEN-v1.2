import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";
import { initDB } from "../config/db";

const router = Router();

router.get("/stats", verifyToken, requireAdmin, async (req, res) => {
  const db = await initDB();

  const users = await db.get("SELECT COUNT(*) as count FROM users");
  const scans = await db.get("SELECT COUNT(*) as count FROM batches");
  const co2 = await db.get("SELECT SUM(co2) as total FROM batches");

  res.json({
    totalUsers: users.count,
    totalScans: scans.count,
    totalCO2: co2.total || 0,
  });
});

export default router;
