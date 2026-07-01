import { Router } from "express";
import { getDashboard, getReport } from "../controllers/municipality.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

// Only admin / municipality roles can access these endpoints
router.get("/dashboard", protect, authorize("admin", "municipality"), getDashboard);
router.get("/report", protect, authorize("admin", "municipality"), getReport);

export default router;
