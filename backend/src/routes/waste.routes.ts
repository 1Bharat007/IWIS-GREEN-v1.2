import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  scanWaste,
  getHistory,
  getLeaderboard,
  getStats,
  getHotspots,
} from "../controllers/waste.controller";

const router = Router();

router.post("/scan", protect, scanWaste);
router.get("/history", protect, getHistory);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/stats", protect, getStats);
router.get("/hotspots", protect, getHotspots);

export default router;
