import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getDB } from "../db";

const router = Router();

router.get("/stats", protect, async (req: any, res: any) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const db = await getDB();

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
