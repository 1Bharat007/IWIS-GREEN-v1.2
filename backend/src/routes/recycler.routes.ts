import { Router } from "express";
import { createProfile, getProfile } from "../controllers/recycler.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/profile", protect, createProfile);
router.get("/profile", protect, getProfile);

export default router;
