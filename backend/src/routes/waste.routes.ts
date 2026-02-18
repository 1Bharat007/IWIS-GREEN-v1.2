import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import {
  scanWaste,
  getHistory,
  getLeaderboard,
  getStats,
} from "../controllers/waste.controller";

const router = Router();

router.post("/scan", protect, scanWaste);
router.get("/history", protect, getHistory);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/stats", protect, getStats);

export default router;
