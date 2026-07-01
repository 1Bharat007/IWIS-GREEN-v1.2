import { Router } from "express";
import { createProfile, getProfile, getSmartListings, getDashboard } from "../controllers/recycler.controller";
import { protect, authorize } from "../middleware/auth.middleware";

const router = Router();

router.post("/profile", protect, createProfile);
router.get("/profile", protect, getProfile);
router.get("/smart-listings", protect, authorize("recycler"), getSmartListings);
router.get("/dashboard", protect, authorize("recycler"), getDashboard);

export default router;
