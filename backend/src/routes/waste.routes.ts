import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { scannerLimiter } from "../middleware/rateLimit.middleware";
import {
  scanWaste,
  getHistory,
  getStats,
  getHotspots,
} from "../controllers/waste.controller";

const router = Router();

router.post("/scan", protect, scannerLimiter, scanWaste);
router.get("/history", protect, getHistory);

router.get("/stats", protect, getStats);
router.get("/hotspots", protect, getHotspots);

export default router;
