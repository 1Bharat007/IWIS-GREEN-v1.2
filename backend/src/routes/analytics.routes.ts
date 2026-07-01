import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import {
  getCitizenDashboard,
  getRecyclerDashboard,
  getPlatformDashboard,
  getAITelemetryDashboard
} from "../controllers/analytics.controller";

const router = Router();

router.get("/telemetry", protect, authorize("admin"), getAITelemetryDashboard);
router.get("/dashboard", getPlatformDashboard);
router.get("/citizen", protect, authorize("citizen"), getCitizenDashboard);
router.get("/recycler", protect, authorize("recycler"), getRecyclerDashboard);

export default router;
